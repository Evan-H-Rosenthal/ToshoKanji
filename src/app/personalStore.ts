const DATABASE_NAME = "toshokanji-personal";
const DATABASE_VERSION = 1;
const STORE_NAME = "content";
let databasePromise: Promise<IDBDatabase> | undefined;
let pendingTimer: number | null = null;
let pendingContent: PersonalContent | null = null;

export interface PersonalContent {
  customNames: Record<string, string>;
  notes: Record<string, string>;
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open personal content database"));
  });
  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Personal content request failed"));
  });
}

export async function loadPersonalContent(): Promise<PersonalContent> {
  try {
    const database = await openDatabase();
    const store = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    const [customNames, notes] = await Promise.all([
      requestResult<Record<string, string> | undefined>(store.get("customNames")),
      requestResult<Record<string, string> | undefined>(store.get("notes")),
    ]);
    return { customNames: customNames ?? {}, notes: notes ?? {} };
  } catch {
    return { customNames: {}, notes: {} };
  }
}

export function schedulePersonalContentSave(content: PersonalContent) {
  pendingContent = content;
  if (pendingTimer !== null) window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(() => void flushPersonalContentSave(), 500);
}

export async function flushPersonalContentSave() {
  const content = pendingContent;
  if (!content) return;
  pendingContent = null;
  if (pendingTimer !== null) window.clearTimeout(pendingTimer);
  pendingTimer = null;
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(content.customNames, "customNames");
    transaction.objectStore(STORE_NAME).put(content.notes, "notes");
  } catch {
    // The app remains usable when private browsing or quota rules disable IndexedDB.
  }
}
