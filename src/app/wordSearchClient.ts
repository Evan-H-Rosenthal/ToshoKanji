import type { WordEntry as StoredWordEntry } from "./types";

export interface WorkerWordSearchResult {
  entry: StoredWordEntry;
  score: number;
  reason: { kind: "word" | "reading" | "meaning"; value: string };
}

let worker: Worker | undefined;
let nextRunId = 0;
const pending = new Map<number, { resolve: (results: WorkerWordSearchResult[]) => void; reject: (error: Error) => void }>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./wordSearch.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ type: string; runId: number; results?: WorkerWordSearchResult[]; message?: string }>) => {
    const request = pending.get(event.data.runId);
    if (!request) return;
    pending.delete(event.data.runId);
    if (event.data.type === "results") request.resolve(event.data.results ?? []);
    else request.reject(new Error(event.data.message ?? "Word search failed"));
  };
  worker.onerror = () => {
    for (const request of pending.values()) request.reject(new Error("Word search worker failed"));
    pending.clear();
  };
  return worker;
}

export function searchStoredWords(query: string, unlockedKanji: Set<string>, favorites: Set<string>, maxResults = 60) {
  const runId = ++nextRunId;
  for (const [id, request] of pending) {
    if (id < runId) {
      request.reject(new DOMException("Superseded", "AbortError"));
      pending.delete(id);
    }
  }
  return new Promise<WorkerWordSearchResult[]>((resolve, reject) => {
    pending.set(runId, { resolve, reject });
    getWorker().postMessage({
      type: "search",
      runId,
      query,
      unlockedKanji: Array.from(unlockedKanji),
      favorites: Array.from(favorites),
      maxResults,
    });
  });
}
