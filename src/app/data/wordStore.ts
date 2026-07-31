import type { WordEntry } from "../types";

const DATABASE_NAME = "toshokanji-dictionary";
const DATABASE_VERSION = 1;
const WORD_STORE = "words";
const META_STORE = "meta";
const DATASET_VERSION_KEY = "dataset-version";

interface WordManifest {
  version: string;
  count: number;
  parts: string[];
}

let databasePromise: Promise<IDBDatabase> | undefined;
let readyPromise: Promise<IDBDatabase> | undefined;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WORD_STORE)) {
        const words = database.createObjectStore(WORD_STORE, { keyPath: "id" });
        words.createIndex("kanjiIds", "kanjiIds", { multiEntry: true });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the dictionary database"));
  });
  return databasePromise;
}

async function fetchManifest(): Promise<WordManifest> {
  const response = await fetch("/data/words/manifest.json");
  if (!response.ok) throw new Error(`Could not load dictionary manifest (${response.status})`);
  return response.json() as Promise<WordManifest>;
}

async function seedDatabase(database: IDBDatabase, manifest: WordManifest) {
  const currentVersion = await requestResult(
    database.transaction(META_STORE, "readonly").objectStore(META_STORE).get(DATASET_VERSION_KEY),
  );
  if (currentVersion === manifest.version) return;

  const clearTransaction = database.transaction([WORD_STORE, META_STORE], "readwrite");
  clearTransaction.objectStore(WORD_STORE).clear();
  clearTransaction.objectStore(META_STORE).clear();
  await transactionDone(clearTransaction);

  for (const partUrl of manifest.parts) {
    const response = await fetch(partUrl);
    if (!response.ok) throw new Error(`Could not load dictionary shard (${response.status})`);
    const entries = await response.json() as WordEntry[];
    const transaction = database.transaction(WORD_STORE, "readwrite");
    const store = transaction.objectStore(WORD_STORE);
    for (const entry of entries) store.put(entry);
    await transactionDone(transaction);
  }

  const metaTransaction = database.transaction(META_STORE, "readwrite");
  metaTransaction.objectStore(META_STORE).put(manifest.version, DATASET_VERSION_KEY);
  metaTransaction.objectStore(META_STORE).put(manifest.count, "word-count");
  await transactionDone(metaTransaction);
}

export function ensureWordDatabase(): Promise<IDBDatabase> {
  if (!readyPromise) {
    readyPromise = Promise.all([openDatabase(), fetchManifest()])
      .then(async ([database, manifest]) => {
        await seedDatabase(database, manifest);
        return database;
      })
      .catch((error) => {
        readyPromise = undefined;
        throw error;
      });
  }
  return readyPromise;
}

export async function getStoredWord(id: string): Promise<WordEntry | undefined> {
  const database = await ensureWordDatabase();
  return requestResult(database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE).get(id));
}

export async function getStoredWords(ids: string[]): Promise<WordEntry[]> {
  const database = await ensureWordDatabase();
  const transaction = database.transaction(WORD_STORE, "readonly");
  const store = transaction.objectStore(WORD_STORE);
  const values = await Promise.all(ids.map((id) => requestResult(store.get(id))));
  await transactionDone(transaction);
  return values.filter((value): value is WordEntry => Boolean(value));
}

export async function getStoredWordsForKanji(kanjiId: string): Promise<WordEntry[]> {
  const database = await ensureWordDatabase();
  const index = database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE).index("kanjiIds");
  return requestResult(index.getAll(kanjiId));
}

export async function scanStoredWords(
  visit: (entry: WordEntry) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const database = await ensureWordDatabase();
  const store = database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE);
  await new Promise<void>((resolve, reject) => {
    const request = store.openCursor();
    request.onerror = () => reject(request.error ?? new Error("Dictionary scan failed"));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || isCancelled()) {
        resolve();
        return;
      }
      visit(cursor.value as WordEntry);
      cursor.continue();
    };
  });
}
