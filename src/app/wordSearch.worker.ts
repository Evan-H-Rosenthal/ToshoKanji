/// <reference lib="webworker" />
import { scanStoredWords } from "./data/wordStore";
import type { WordEntry } from "./types";

type SearchRequest = {
  type: "search";
  runId: number;
  query: string;
  unlockedKanji: string[];
  favorites: string[];
  maxResults: number;
};

type SearchReason = { kind: "word" | "reading" | "meaning"; value: string };
type SearchResult = { entry: WordEntry; score: number; reason: SearchReason };

let activeRunId = 0;

function normalize(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

function normalizeKana(value: string) {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
  }).join("");
}

function scoreField(value: string, query: string, kanaQuery: string, exactScore: number, partialScore: number) {
  const normalized = normalize(value);
  const kana = normalizeKana(normalized);
  if (normalized === query || kana === kanaQuery) return exactScore;
  if (query.length > 1 && (normalized.includes(query) || kana.includes(kanaQuery))) return partialScore;
  return 0;
}

self.onmessage = async (event: MessageEvent<SearchRequest>) => {
  if (event.data.type !== "search") return;
  const { runId, query, unlockedKanji, favorites, maxResults } = event.data;
  activeRunId = runId;
  const normalizedQuery = normalize(query);
  const kanaQuery = normalizeKana(normalizedQuery);
  const unlocked = new Set(unlockedKanji);
  const favoriteSet = new Set(favorites);
  const results: SearchResult[] = [];

  try {
    await scanStoredWords((entry) => {
      if (!entry.kanjiIds.some((id) => unlocked.has(id))) return;
      const fields: Array<[SearchReason["kind"], string, number, number]> = [
        ["word", entry.word.japanese, 880, 390],
        ["reading", entry.word.furigana, 760, 430],
        ["meaning", entry.word.meaning, 640, 330],
      ];
      let best: { score: number; reason: SearchReason } | undefined;
      for (const [kind, value, exact, partial] of fields) {
        const score = scoreField(value, normalizedQuery, kanaQuery, exact, partial);
        if (score && (!best || score > best.score)) best = { score, reason: { kind, value } };
      }
      if (!best) return;
      const score = best.score + (entry.word.common ? 8 : 0) + (favoriteSet.has(`word:${entry.id}`) ? 18 : 0);
      results.push({ entry, score, reason: best.reason });
      results.sort((a, b) => b.score - a.score || a.entry.word.japanese.localeCompare(b.entry.word.japanese));
      if (results.length > maxResults) results.pop();
    }, () => activeRunId !== runId);

    if (activeRunId === runId) self.postMessage({ type: "results", runId, results });
  } catch (error) {
    if (activeRunId === runId) self.postMessage({ type: "error", runId, message: error instanceof Error ? error.message : "Word search failed" });
  }
};

export {};
