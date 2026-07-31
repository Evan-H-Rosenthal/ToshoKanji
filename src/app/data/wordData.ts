import { KANJI_BY_ID } from "./entryIndexes";
import { getStoredWord, getStoredWords, getStoredWordsForKanji } from "./wordStore";
import { getLearningCategoryColors } from "./ui/categoryColors";
import type { KanjiEntry, Word, WordEntry as StoredWordEntry } from "../types";

export interface WordEntry {
  id: string;
  word: Word;
  kanji: KanjiEntry[];
}

const RESOLVED_CACHE_LIMIT = 256;
const resolvedCache = new Map<string, WordEntry>();

function orderKanjiBySpelling(kanji: KanjiEntry[], spelling: string) {
  const kanjiByChar = new Map(kanji.map((entry) => [entry.char, entry]));
  const seenIds = new Set<string>();
  const ordered: KanjiEntry[] = [];
  for (const char of Array.from(spelling)) {
    const entry = kanjiByChar.get(char);
    if (!entry || seenIds.has(entry.id)) continue;
    ordered.push(entry);
    seenIds.add(entry.id);
  }
  for (const entry of kanji) {
    if (seenIds.has(entry.id)) continue;
    ordered.push(entry);
    seenIds.add(entry.id);
  }
  return ordered;
}

export function resolveStoredWordEntry(entry: StoredWordEntry): WordEntry {
  const cached = resolvedCache.get(entry.id);
  if (cached) {
    resolvedCache.delete(entry.id);
    resolvedCache.set(entry.id, cached);
    return cached;
  }
  const resolvedKanji = entry.kanjiIds
    .map((kanjiId) => KANJI_BY_ID.get(kanjiId))
    .filter((value): value is KanjiEntry => Boolean(value));
  const resolved = { id: entry.id, word: entry.word, kanji: orderKanjiBySpelling(resolvedKanji, entry.word.japanese) };
  resolvedCache.set(entry.id, resolved);
  if (resolvedCache.size > RESOLVED_CACHE_LIMIT) {
    const oldest = resolvedCache.keys().next().value;
    if (oldest) resolvedCache.delete(oldest);
  }
  return resolved;
}

export async function getFavoriteWordEntries(favorites: Set<string>): Promise<WordEntry[]> {
  const ids = Array.from(favorites, (key) => key.startsWith("word:") ? key.slice(5) : "").filter(Boolean);
  return (await getStoredWords(ids)).map(resolveStoredWordEntry);
}

export async function findWordEntry(id: string): Promise<WordEntry | undefined> {
  const cached = resolvedCache.get(id);
  if (cached) return cached;
  const entry = await getStoredWord(id);
  return entry ? resolveStoredWordEntry(entry) : undefined;
}

function storedKanjiRank(entry: StoredWordEntry, kanjiId: string): number {
  const kanjiIndex = entry.kanjiIds.indexOf(kanjiId);
  const rank = kanjiIndex >= 0 ? entry.kanjiRanks?.[kanjiIndex] : undefined;
  return Number.isInteger(rank) ? rank! : Number.MAX_SAFE_INTEGER;
}

function compareFallbackLearnerOrder(a: StoredWordEntry, b: StoredWordEntry): number {
  return Number(Boolean(b.word.common)) - Number(Boolean(a.word.common))
    || Array.from(a.word.japanese).length - Array.from(b.word.japanese).length
    || Number(Boolean(a.word.wordTags?.length)) - Number(Boolean(b.word.wordTags?.length))
    || a.word.japanese.localeCompare(b.word.japanese, "ja");
}

export async function getWordsForKanji(kanjiId: string): Promise<Word[]> {
  const entries = await getStoredWordsForKanji(kanjiId);
  entries.sort((a, b) => storedKanjiRank(a, kanjiId) - storedKanjiRank(b, kanjiId)
    || compareFallbackLearnerOrder(a, b));
  return entries.map((entry) => entry.word);
}

export function getWordEntryColors(entry: WordEntry): [string, string] {
  const categoryColors = entry.kanji.map((kanji) => getLearningCategoryColors(kanji.learningCategory));
  const uniqueColors = Array.from(new Set(categoryColors.flat()));
  if (uniqueColors.length === 0) return ["#6b7280", "#4b5563"];
  if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];
  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}
