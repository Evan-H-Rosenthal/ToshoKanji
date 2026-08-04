import type { Word, WordEntry, WordMetadataTag, WordSense } from "../types";

const DATABASE_NAME = "toshokanji-dictionary";
const DATABASE_VERSION = 2;
const WORD_STORE = "words";
const META_STORE = "meta";
const DATASET_VERSION_KEY = "dataset-version";

interface WordManifest {
  schemaVersion: 3;
  encoding: "tosho-word-array-v1";
  version: string;
  count: number;
  parts: string[];
}

type EncodedSense = [number, string[], string[]?, string[]?, string[]?, string[]?, string[]?];
type EncodedWord = [
  string, string, string, string, 0 | 1, EncodedSense[], string, number, number,
  WordMetadataTag[]?, string[]?, string[]?, string[]?, "unavailable"?,
];
type EncodedWordRecord = [string, EncodedWord, string[], number[]];
interface StoredCompactWord {
  id: string;
  japanese: string;
  encoded: EncodedWord;
  kanjiIds: string[];
  kanjiRanks: number[];
}

function decodeSense(value: EncodedSense): WordSense {
  return {
    index: value[0],
    glosses: value[1],
    ...(value[2] ? { partsOfSpeech: value[2] } : {}),
    ...(value[3] ? { fields: value[3] } : {}),
    ...(value[4] ? { usageLabels: value[4] } : {}),
    ...(value[5] ? { dialects: value[5] } : {}),
    ...(value[6] ? { notes: value[6] } : {}),
  };
}

function decodeStoredWord(value: StoredCompactWord | WordEntry): WordEntry {
  if ("word" in value) return value;
  const encoded = value.encoded;
  const word: Word = {
    id: value.id,
    japanese: encoded[0],
    furigana: encoded[1],
    romaji: encoded[2],
    meaning: encoded[3],
    common: Boolean(encoded[4]),
    senses: encoded[5].map(decodeSense),
    source: { dataset: "JMdict_e", entryId: encoded[6], spellingIndex: encoded[7], readingIndex: encoded[8] },
    ...(encoded[9] ? { wordTags: encoded[9] } : {}),
    ...(encoded[10] ? { priorityTags: encoded[10] } : {}),
    ...(encoded[11] ? { information: encoded[11] } : {}),
    ...(encoded[12] ? { usageLabels: encoded[12] } : {}),
    ...(encoded[13] ? { romanizationStatus: encoded[13] } : {}),
  };
  return { id: value.id, word, kanjiIds: value.kanjiIds, kanjiRanks: value.kanjiRanks };
}

function compactForStorage(value: EncodedWordRecord): StoredCompactWord {
  return { id: value[0], japanese: value[1][0], encoded: value[1], kanjiIds: value[2], kanjiRanks: value[3] };
}

export interface WordDatabaseProgress {
  phase: "checking" | "loading" | "ready" | "error";
  progress: number;
  loadedParts: number;
  totalParts: number;
  loadedWords: number;
  totalWords: number;
  error?: string;
}

const progressListeners = new Set<(progress: WordDatabaseProgress) => void>();
let latestProgress: WordDatabaseProgress = {
  phase: "checking",
  progress: 0,
  loadedParts: 0,
  totalParts: 0,
  loadedWords: 0,
  totalWords: 0,
};

function emitProgress(progress: WordDatabaseProgress) {
  latestProgress = progress;
  for (const listener of progressListeners) listener(progress);
}

export function subscribeWordDatabaseProgress(listener: (progress: WordDatabaseProgress) => void) {
  progressListeners.add(listener);
  listener(latestProgress);
  return () => {
    progressListeners.delete(listener);
  };
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
      const transaction = request.transaction!;
      const words = database.objectStoreNames.contains(WORD_STORE)
        ? transaction.objectStore(WORD_STORE)
        : database.createObjectStore(WORD_STORE, { keyPath: "id" });
      if (!words.indexNames.contains("kanjiIds")) words.createIndex("kanjiIds", "kanjiIds", { multiEntry: true });
      if (!words.indexNames.contains("japanese")) words.createIndex("japanese", "japanese");
      const meta = database.objectStoreNames.contains(META_STORE)
        ? transaction.objectStore(META_STORE)
        : database.createObjectStore(META_STORE);
      if (request.oldVersion < 2) meta.delete(DATASET_VERSION_KEY);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the dictionary database"));
  });
  return databasePromise;
}

async function fetchManifest(): Promise<WordManifest> {
  const response = await fetch("/data/words/manifest.json");
  if (!response.ok) throw new Error(`Could not load dictionary manifest (${response.status})`);
  const manifest = await response.json() as WordManifest;
  if (manifest.schemaVersion !== 3 || manifest.encoding !== "tosho-word-array-v1") {
    throw new Error("This dictionary uses an unsupported storage schema");
  }
  return manifest;
}

async function seedDatabase(database: IDBDatabase, manifest: WordManifest, forceReload = false) {
  const currentVersion = await requestResult(
    database.transaction(META_STORE, "readonly").objectStore(META_STORE).get(DATASET_VERSION_KEY),
  );
  if (!forceReload && currentVersion === manifest.version) {
    emitProgress({
      phase: "ready",
      progress: 1,
      loadedParts: manifest.parts.length,
      totalParts: manifest.parts.length,
      loadedWords: manifest.count,
      totalWords: manifest.count,
    });
    return;
  }

  emitProgress({
    phase: "loading",
    progress: 0,
    loadedParts: 0,
    totalParts: manifest.parts.length,
    loadedWords: 0,
    totalWords: manifest.count,
  });

  const clearTransaction = database.transaction([WORD_STORE, META_STORE], "readwrite");
  clearTransaction.objectStore(WORD_STORE).clear();
  clearTransaction.objectStore(META_STORE).clear();
  await transactionDone(clearTransaction);

  let loadedWords = 0;
  for (const [partIndex, partUrl] of manifest.parts.entries()) {
    const response = await fetch(partUrl);
    if (!response.ok) throw new Error(`Could not load dictionary shard (${response.status})`);
    const entries = await response.json() as EncodedWordRecord[];
    const transaction = database.transaction(WORD_STORE, "readwrite");
    const store = transaction.objectStore(WORD_STORE);
    for (const entry of entries) store.put(compactForStorage(entry));
    await transactionDone(transaction);
    loadedWords += entries.length;
    emitProgress({
      phase: "loading",
      progress: (partIndex + 1) / manifest.parts.length,
      loadedParts: partIndex + 1,
      totalParts: manifest.parts.length,
      loadedWords,
      totalWords: manifest.count,
    });
  }

  const metaTransaction = database.transaction(META_STORE, "readwrite");
  metaTransaction.objectStore(META_STORE).put(manifest.version, DATASET_VERSION_KEY);
  metaTransaction.objectStore(META_STORE).put(manifest.count, "word-count");
  await transactionDone(metaTransaction);
  emitProgress({
    phase: "ready",
    progress: 1,
    loadedParts: manifest.parts.length,
    totalParts: manifest.parts.length,
    loadedWords: manifest.count,
    totalWords: manifest.count,
  });
}

function loadWordDatabase(forceReload: boolean): Promise<IDBDatabase> {
  if (forceReload) {
    emitProgress({
      phase: "loading",
      progress: 0,
      loadedParts: 0,
      totalParts: latestProgress.totalParts,
      loadedWords: 0,
      totalWords: latestProgress.totalWords,
    });
  } else {
    emitProgress({
      phase: "checking",
      progress: 0,
      loadedParts: 0,
      totalParts: 0,
      loadedWords: 0,
      totalWords: 0,
    });
  }

  return Promise.all([openDatabase(), fetchManifest()])
    .then(async ([database, manifest]) => {
      await seedDatabase(database, manifest, forceReload);
      return database;
    })
    .catch((error) => {
      readyPromise = undefined;
      emitProgress({
        phase: "error",
        progress: 0,
        loadedParts: 0,
        totalParts: 0,
        loadedWords: 0,
        totalWords: 0,
        error: error instanceof Error ? error.message : "Could not load dictionaries",
      });
      throw error;
    });
}

export function ensureWordDatabase(): Promise<IDBDatabase> {
  if (!readyPromise) readyPromise = loadWordDatabase(false);
  return readyPromise;
}

export function reloadWordDatabase(): Promise<IDBDatabase> {
  readyPromise = loadWordDatabase(true);
  return readyPromise;
}

export async function getStoredWord(id: string): Promise<WordEntry | undefined> {
  const database = await ensureWordDatabase();
  const store = database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE);
  const value = await requestResult<StoredCompactWord | WordEntry | undefined>(store.get(id));
  if (value) return decodeStoredWord(value);

  // Before source identities were introduced, word keys were only `w-{spelling}`.
  const spelling = id.startsWith("w-") && !/^w-\d+-\d+-\d+$/.test(id) ? id.slice(2) : "";
  if (!spelling) return undefined;
  const legacyIndex = database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE).index("japanese");
  const candidates = await requestResult<Array<StoredCompactWord | WordEntry>>(legacyIndex.getAll(spelling));
  if (!candidates.length) return undefined;
  const resolved = candidates.map(decodeStoredWord).sort((a, b) =>
    Number(Boolean(b.word.common)) - Number(Boolean(a.word.common))
    || Number(Boolean(a.word.wordTags?.length)) - Number(Boolean(b.word.wordTags?.length))
    || a.word.furigana.localeCompare(b.word.furigana, "ja")
    || a.id.localeCompare(b.id));
  return { ...resolved[0], id, word: { ...resolved[0].word, id } };
}

export async function getStoredWords(ids: string[]): Promise<WordEntry[]> {
  const values = await Promise.all(ids.map(getStoredWord));
  return values.filter((value): value is WordEntry => Boolean(value));
}

export async function getStoredWordsForKanji(kanjiId: string): Promise<WordEntry[]> {
  const database = await ensureWordDatabase();
  const index = database.transaction(WORD_STORE, "readonly").objectStore(WORD_STORE).index("kanjiIds");
  const values = await requestResult<Array<StoredCompactWord | WordEntry>>(index.getAll(kanjiId));
  return values.map(decodeStoredWord);
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
      visit(decodeStoredWord(cursor.value as StoredCompactWord | WordEntry));
      cursor.continue();
    };
  });
}
