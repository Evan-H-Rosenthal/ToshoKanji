import type { Word, WordEntry, WordMetadataTag, WordSense } from "../types";

const DATABASE_NAME = "toshokanji-dictionary";
const DATABASE_VERSION = 5;
const WORD_STORE = "words";
const STAGING_WORD_STORE = "words-staging";
const META_STORE = "meta";
const DATASET_VERSION_KEY = "dataset-version";
const WORD_COUNT_KEY = "word-count";
const ACTIVE_WORD_STORE_KEY = "active-word-store";
const MAX_LOAD_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 8_000;

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
interface StoredCompactWord {
  id: string;
  entryId: string;
  japanese: string;
  encoded: EncodedWord;
  kanjiIds: string[];
  kanjiRanks: number[];
}
type WordStoreName = typeof WORD_STORE | typeof STAGING_WORD_STORE;

interface CachedDictionaryInfo {
  version: string;
  count: number;
}

export type WordDatabaseOperation = "startup" | "reload";
export type WordDatabaseErrorKind = "offline-first-load" | "offline-reload" | "load-failed";

export interface WordDatabaseProgress {
  phase: "checking" | "loading" | "ready" | "error";
  progress: number;
  loadedParts: number;
  totalParts: number;
  loadedWords: number;
  totalWords: number;
  operation?: WordDatabaseOperation;
  attempt?: number;
  maxAttempts?: number;
  error?: string;
  errorKind?: WordDatabaseErrorKind;
  canContinueWithCache?: boolean;
}

class DictionaryConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DictionaryConnectionError";
  }
}

class DictionaryDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DictionaryDataError";
  }
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

function compactForStorage(value: unknown, location: string): StoredCompactWord {
  if (!Array.isArray(value) || typeof value[0] !== "string" || !value[0]) {
    throw new DictionaryDataError(`Dictionary record ${location} is missing its ID.`);
  }
  const encoded = value[1];
  if (
    !Array.isArray(encoded)
    || typeof encoded[0] !== "string"
    || !encoded[0]
    || !Array.isArray(encoded[5])
    || typeof encoded[6] !== "string"
    || !Array.isArray(value[2])
    || !value[2].every((id) => typeof id === "string")
    || !Array.isArray(value[3])
    || !value[3].every((rank) => typeof rank === "number")
  ) {
    throw new DictionaryDataError(`Dictionary record ${location} has an invalid shape.`);
  }
  return {
    id: value[0],
    entryId: encoded[6],
    japanese: encoded[0],
    encoded: encoded as EncodedWord,
    kanjiIds: value[2],
    kanjiRanks: value[3],
  };
}

const progressListeners = new Set<(progress: WordDatabaseProgress) => void>();
let latestProgress: WordDatabaseProgress = {
  phase: "checking",
  progress: 0,
  loadedParts: 0,
  totalParts: 0,
  loadedWords: 0,
  totalWords: 0,
  operation: "startup",
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
let inactiveCleanupPromise: Promise<void> | undefined;
let activeWordStoreName: WordStoreName = WORD_STORE;

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

function configureWordStore(store: IDBObjectStore) {
  if (!store.indexNames.contains("kanjiIds")) store.createIndex("kanjiIds", "kanjiIds", { multiEntry: true });
  if (!store.indexNames.contains("japanese")) store.createIndex("japanese", "japanese");
  if (!store.indexNames.contains("entryId")) store.createIndex("entryId", "entryId");
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("The dictionary database took too long to open"));
    }, FETCH_TIMEOUT_MS);

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction!;
      const words = database.objectStoreNames.contains(WORD_STORE)
        ? transaction.objectStore(WORD_STORE)
        : database.createObjectStore(WORD_STORE, { keyPath: "id" });
      configureWordStore(words);
      const staging = database.objectStoreNames.contains(STAGING_WORD_STORE)
        ? transaction.objectStore(STAGING_WORD_STORE)
        : database.createObjectStore(STAGING_WORD_STORE, { keyPath: "id" });
      configureWordStore(staging);
      const meta = database.objectStoreNames.contains(META_STORE)
        ? transaction.objectStore(META_STORE)
        : database.createObjectStore(META_STORE);
      if (request.oldVersion < 5) meta.delete(DATASET_VERSION_KEY);
    };
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reject(request.error ?? new Error("Could not open the dictionary database"));
    };
    request.onblocked = () => {
      // Give older app tabs time to release their connection; the timeout handles a persistent block.
    };
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function openDatabaseWithRetries(): Promise<IDBDatabase> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt += 1) {
    try {
      return await openDatabase();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_LOAD_ATTEMPTS) await retryDelay(attempt);
    }
  }
  throw lastError ?? new Error("Could not open the dictionary database");
}

function isDefinitelyOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function fetchDictionaryJson<T>(url: string): Promise<T> {
  if (isDefinitelyOffline()) {
    throw new DictionaryConnectionError("No internet connection is available.");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Dictionary download returned HTTP ${response.status}.`);
    return await response.json() as T;
  } catch (error) {
    if (error instanceof DictionaryConnectionError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DictionaryConnectionError("The dictionary download timed out.");
    }
    if (error instanceof TypeError) {
      throw new DictionaryConnectionError("The dictionary download could not be reached.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function validateManifest(value: unknown): WordManifest {
  const manifest = value as Partial<WordManifest>;
  if (
    !manifest
    || manifest.schemaVersion !== 3
    || manifest.encoding !== "tosho-word-array-v1"
    || typeof manifest.version !== "string"
    || !manifest.version
    || !Number.isSafeInteger(manifest.count)
    || (manifest.count ?? 0) <= 0
    || !Array.isArray(manifest.parts)
    || manifest.parts.length === 0
    || !manifest.parts.every((part) => typeof part === "string" && part.length > 0)
  ) {
    throw new DictionaryDataError("The downloaded dictionary manifest is not valid.");
  }
  return manifest as WordManifest;
}

async function fetchManifest(): Promise<WordManifest> {
  return validateManifest(await fetchDictionaryJson<unknown>("/data/words/manifest.json"));
}

async function readCachedDictionaryInfo(database: IDBDatabase): Promise<CachedDictionaryInfo | undefined> {
  const metaTransaction = database.transaction(META_STORE, "readonly");
  const metaDone = transactionDone(metaTransaction);
  const meta = metaTransaction.objectStore(META_STORE);
  const [version, expectedCount, storedActiveStore] = await Promise.all([
    requestResult<unknown>(meta.get(DATASET_VERSION_KEY)),
    requestResult<unknown>(meta.get(WORD_COUNT_KEY)),
    requestResult<unknown>(meta.get(ACTIVE_WORD_STORE_KEY)),
  ]);
  await metaDone;

  activeWordStoreName = storedActiveStore === STAGING_WORD_STORE ? STAGING_WORD_STORE : WORD_STORE;
  const countTransaction = database.transaction(activeWordStoreName, "readonly");
  const countDone = transactionDone(countTransaction);
  const actualCount = await requestResult(countTransaction.objectStore(activeWordStoreName).count());
  await countDone;

  if (
    typeof version !== "string"
    || !version
    || typeof expectedCount !== "number"
    || expectedCount <= 0
    || actualCount !== expectedCount
  ) {
    return undefined;
  }
  return { version, count: actualCount };
}

function emitReady(cache: CachedDictionaryInfo, manifest?: WordManifest) {
  emitProgress({
    phase: "ready",
    progress: 1,
    loadedParts: manifest?.parts.length ?? 0,
    totalParts: manifest?.parts.length ?? 0,
    loadedWords: cache.count,
    totalWords: cache.count,
  });
}

async function clearWordStore(database: IDBDatabase, storeName: WordStoreName) {
  const transaction = database.transaction(storeName, "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(storeName).clear();
  await done;
}

async function promoteStagedDictionary(
  database: IDBDatabase,
  manifest: WordManifest,
  stagedStoreName: WordStoreName,
) {
  const previousStoreName = activeWordStoreName;
  const transaction = database.transaction(META_STORE, "readwrite");
  const done = transactionDone(transaction);
  const meta = transaction.objectStore(META_STORE);
  meta.put(manifest.version, DATASET_VERSION_KEY);
  meta.put(manifest.count, WORD_COUNT_KEY);
  meta.put(stagedStoreName, ACTIVE_WORD_STORE_KEY);
  await done;

  activeWordStoreName = stagedStoreName;
  if (previousStoreName !== stagedStoreName) {
    inactiveCleanupPromise = clearWordStore(database, previousStoreName).catch(() => {
      // The newly active dictionary is complete; stale inactive data can be cleared on the next reload.
    });
  }
}

async function stageDictionary(
  database: IDBDatabase,
  manifest: WordManifest,
  operation: WordDatabaseOperation,
  attempt: number,
) {
  const stagedStoreName: WordStoreName =
    activeWordStoreName === WORD_STORE ? STAGING_WORD_STORE : WORD_STORE;
  if (inactiveCleanupPromise) {
    await inactiveCleanupPromise;
    inactiveCleanupPromise = undefined;
  }
  await clearWordStore(database, stagedStoreName);
  let loadedWords = 0;

  emitProgress({
    phase: "loading",
    progress: 0,
    loadedParts: 0,
    totalParts: manifest.parts.length,
    loadedWords: 0,
    totalWords: manifest.count,
    operation,
    attempt,
    maxAttempts: MAX_LOAD_ATTEMPTS,
  });

  for (const [partIndex, partUrl] of manifest.parts.entries()) {
    const entries = await fetchDictionaryJson<unknown[]>(partUrl);
    if (!Array.isArray(entries)) {
      throw new DictionaryDataError(`Dictionary shard ${partIndex + 1} is not a record list.`);
    }
    const compactEntries = entries.map((entry, entryIndex) =>
      compactForStorage(entry, `${partIndex + 1}:${entryIndex + 1}`),
    );
    const transaction = database.transaction(stagedStoreName, "readwrite");
    const done = transactionDone(transaction);
    const store = transaction.objectStore(stagedStoreName);
    for (const entry of compactEntries) store.put(entry);
    await done;
    loadedWords += compactEntries.length;
    emitProgress({
      phase: "loading",
      progress: (partIndex + 1) / manifest.parts.length,
      loadedParts: partIndex + 1,
      totalParts: manifest.parts.length,
      loadedWords,
      totalWords: manifest.count,
      operation,
      attempt,
      maxAttempts: MAX_LOAD_ATTEMPTS,
    });
  }

  const stagedCount = await requestResult(
    database.transaction(stagedStoreName, "readonly").objectStore(stagedStoreName).count(),
  );
  if (loadedWords !== manifest.count || stagedCount !== manifest.count) {
    throw new DictionaryDataError(
      `The dictionary download contained ${loadedWords.toLocaleString()} records; ${manifest.count.toLocaleString()} were expected.`,
    );
  }

  await promoteStagedDictionary(database, manifest, stagedStoreName);
  emitReady({ version: manifest.version, count: manifest.count }, manifest);
}

function retryDelay(attempt: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 350 * attempt));
}

function makeTerminalError(
  operation: WordDatabaseOperation,
  cache: CachedDictionaryInfo | undefined,
  error: unknown,
): WordDatabaseProgress {
  const offline = isDefinitelyOffline() || error instanceof DictionaryConnectionError;
  const canContinueWithCache = Boolean(cache);
  if (offline && operation === "startup" && !cache) {
    return {
      phase: "error",
      progress: 0,
      loadedParts: 0,
      totalParts: 0,
      loadedWords: 0,
      totalWords: 0,
      operation,
      attempt: MAX_LOAD_ATTEMPTS,
      maxAttempts: MAX_LOAD_ATTEMPTS,
      errorKind: "offline-first-load",
      error: "ToshoKanji needs an internet connection the first time it prepares its dictionaries. Get online, then try again. After that, they will work offline.",
      canContinueWithCache: false,
    };
  }
  if (offline && cache) {
    return {
      phase: "error",
      progress: 0,
      loadedParts: 0,
      totalParts: 0,
      loadedWords: cache.count,
      totalWords: cache.count,
      operation,
      attempt: MAX_LOAD_ATTEMPTS,
      maxAttempts: MAX_LOAD_ATTEMPTS,
      errorKind: "offline-reload",
      error: "ToshoKanji needs an internet connection to reload its dictionaries. Your saved dictionaries are still safe, so you can go back and keep using them offline.",
      canContinueWithCache,
    };
  }
  return {
    phase: "error",
    progress: 0,
    loadedParts: 0,
    totalParts: 0,
    loadedWords: cache?.count ?? 0,
    totalWords: cache?.count ?? 0,
    operation,
    attempt: MAX_LOAD_ATTEMPTS,
    maxAttempts: MAX_LOAD_ATTEMPTS,
    errorKind: "load-failed",
    error: cache
      ? "ToshoKanji could not reload its dictionaries after three tries. Your saved dictionaries are still safe, so you can go back and keep using them."
      : "ToshoKanji could not prepare its dictionaries after three tries. Check your connection and available storage, then try again.",
    canContinueWithCache,
  };
}

async function downloadWithRetries(
  database: IDBDatabase,
  operation: WordDatabaseOperation,
  forceReload: boolean,
  cache: CachedDictionaryInfo | undefined,
): Promise<IDBDatabase> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt += 1) {
    try {
      emitProgress({
        phase: "loading",
        progress: 0,
        loadedParts: 0,
        totalParts: 0,
        loadedWords: 0,
        totalWords: cache?.count ?? 0,
        operation,
        attempt,
        maxAttempts: MAX_LOAD_ATTEMPTS,
      });
      const manifest = await fetchManifest();
      if (!forceReload && cache?.version === manifest.version) {
        emitReady(cache, manifest);
        return database;
      }
      await stageDictionary(database, manifest, operation, attempt);
      return database;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_LOAD_ATTEMPTS) await retryDelay(attempt);
    }
  }
  throw lastError ?? new Error("Could not load dictionaries");
}

async function refreshCachedDictionary(database: IDBDatabase, cache: CachedDictionaryInfo) {
  let manifest: WordManifest | undefined;
  for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt += 1) {
    try {
      manifest = await fetchManifest();
      break;
    } catch {
      if (attempt < MAX_LOAD_ATTEMPTS) await retryDelay(attempt);
    }
  }

  if (!manifest || manifest.version === cache.version) return;
  try {
    await stageDictionary(database, manifest, "startup", 1);
  } catch {
    // A valid active cache always wins over a failed automatic refresh.
    emitReady(cache);
  }
}

async function loadWordDatabase(forceReload: boolean): Promise<IDBDatabase> {
  const operation: WordDatabaseOperation = forceReload ? "reload" : "startup";
  emitProgress({
    phase: forceReload ? "loading" : "checking",
    progress: 0,
    loadedParts: 0,
    totalParts: 0,
    loadedWords: 0,
    totalWords: 0,
    operation,
    attempt: 1,
    maxAttempts: MAX_LOAD_ATTEMPTS,
  });

  let database: IDBDatabase;
  let cache: CachedDictionaryInfo | undefined;
  try {
    database = await openDatabaseWithRetries();
    cache = await readCachedDictionaryInfo(database);

    if (!forceReload && cache) {
      emitReady(cache);
      if (!isDefinitelyOffline()) void refreshCachedDictionary(database, cache);
      return database;
    }

    return await downloadWithRetries(database, operation, forceReload, cache);
  } catch (error) {
    readyPromise = undefined;
    const terminal = makeTerminalError(operation, cache, error);
    emitProgress(terminal);
    throw error;
  }
}

export function ensureWordDatabase(): Promise<IDBDatabase> {
  if (!readyPromise) readyPromise = loadWordDatabase(false);
  return readyPromise;
}

export function reloadWordDatabase(): Promise<IDBDatabase> {
  readyPromise = loadWordDatabase(true);
  return readyPromise;
}

export function retryWordDatabaseLoad(): Promise<IDBDatabase> {
  readyPromise = loadWordDatabase(latestProgress.operation === "reload");
  return readyPromise;
}

export async function resumeCachedWordDatabase(): Promise<IDBDatabase> {
  const database = await openDatabase();
  const cache = await readCachedDictionaryInfo(database);
  if (!cache) throw new Error("No saved dictionary is available");
  readyPromise = Promise.resolve(database);
  emitReady(cache);
  return database;
}

export async function getStoredWord(id: string): Promise<WordEntry | undefined> {
  const database = await ensureWordDatabase();
  const store = database.transaction(activeWordStoreName, "readonly").objectStore(activeWordStoreName);
  const value = await requestResult<StoredCompactWord | WordEntry | undefined>(store.get(id));
  if (value) return decodeStoredWord(value);

  // Before source identities were introduced, word keys were only `w-{spelling}`.
  const spelling = id.startsWith("w-") && !/^w-\d+-\d+-\d+$/.test(id) ? id.slice(2) : "";
  if (!spelling) return undefined;
  const legacyIndex = database.transaction(activeWordStoreName, "readonly").objectStore(activeWordStoreName).index("japanese");
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
  const index = database.transaction(activeWordStoreName, "readonly").objectStore(activeWordStoreName).index("kanjiIds");
  const values = await requestResult<Array<StoredCompactWord | WordEntry>>(index.getAll(kanjiId));
  return values.map(decodeStoredWord);
}

export async function getStoredWordsForEntry(entryId: string): Promise<WordEntry[]> {
  const database = await ensureWordDatabase();
  const index = database.transaction(activeWordStoreName, "readonly").objectStore(activeWordStoreName).index("entryId");
  const values = await requestResult<Array<StoredCompactWord | WordEntry>>(index.getAll(entryId));
  return values.map(decodeStoredWord);
}

export async function scanStoredWords(
  visit: (entry: WordEntry) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const database = await ensureWordDatabase();
  const store = database.transaction(activeWordStoreName, "readonly").objectStore(activeWordStoreName);
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
