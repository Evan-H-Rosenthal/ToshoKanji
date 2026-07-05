import { KANJI_BY_ID } from "./entryIndexes";
import { getLearningCategoryColors } from "./ui/categoryColors";
import type { KanjiEntry, Word, WordEntry as GeneratedWordEntry } from "../types";

export interface WordEntry {
  id: string;
  word: Word;
  kanji: KanjiEntry[];
}

type WordPartNumber = 1 | 2 | 3 | 4 | 5;
type RawWordPartModule = { default: string };

const WORD_PART_LOADERS: Record<WordPartNumber, () => Promise<RawWordPartModule>> = {
  1: () => import("./generated/words.part-1.generated?raw"),
  2: () => import("./generated/words.part-2.generated?raw"),
  3: () => import("./generated/words.part-3.generated?raw"),
  4: () => import("./generated/words.part-4.generated?raw"),
  5: () => import("./generated/words.part-5.generated?raw"),
};

const WORD_PART_START_IDS: Array<[WordPartNumber, string]> = [
  [1, "w-2.5次元"],
  [2, "w-再洗礼"],
  [3, "w-市外電話"],
  [4, "w-法楽"],
  [5, "w-花虎の尾"],
];

const loadedWordParts = new Map<WordPartNumber, Promise<GeneratedWordEntry[]>>();
const wordById = new Map<string, GeneratedWordEntry>();

function resolveWordEntry(entry: GeneratedWordEntry): WordEntry {
  const kanji = entry.kanjiIds
    .map((kanjiId) => KANJI_BY_ID.get(kanjiId))
    .filter((value): value is KanjiEntry => Boolean(value));

  return { id: entry.id, word: entry.word, kanji };
}

function getWordPartForId(id: string): WordPartNumber {
  let selectedPart: WordPartNumber = 1;
  for (const [part, startId] of WORD_PART_START_IDS) {
    if (id >= startId) selectedPart = part;
    else break;
  }
  return selectedPart;
}

function parseWordPart(rawSource: string): GeneratedWordEntry[] {
  const match = rawSource.match(/export const WORDS_PART_\d+: WordEntry\[\] = (\[[\s\S]*\]);\s*$/);
  if (!match) throw new Error("Could not parse generated word part");
  return JSON.parse(match[1]) as GeneratedWordEntry[];
}

async function loadWordPart(part: WordPartNumber) {
  const existing = loadedWordParts.get(part);
  if (existing) return existing;

  const promise = WORD_PART_LOADERS[part]().then((module) => {
    const entries = parseWordPart(module.default);
    for (const entry of entries) wordById.set(entry.id, entry);
    return entries;
  });
  loadedWordParts.set(part, promise);
  return promise;
}

async function loadWordPartsForIds(ids: string[]) {
  const parts = Array.from(new Set(ids.map(getWordPartForId)));
  await Promise.all(parts.map(loadWordPart));
}

export async function getWordEntries(): Promise<WordEntry[]> {
  const parts = await Promise.all(([1, 2, 3, 4, 5] as WordPartNumber[]).map(loadWordPart));
  return parts.flat().map(resolveWordEntry);
}

export async function getFavoriteWordEntries(favorites: Set<string>): Promise<WordEntry[]> {
  const ids = Array.from(favorites, (key) => key.startsWith("word:") ? key.slice(5) : "").filter(Boolean);
  await loadWordPartsForIds(ids);
  return ids
    .map((id) => wordById.get(id))
    .filter((value): value is GeneratedWordEntry => Boolean(value))
    .map(resolveWordEntry);
}

export async function findWordEntry(id: string): Promise<WordEntry | undefined> {
  await loadWordPart(getWordPartForId(id));

  let entry = wordById.get(id);
  if (!entry) {
    const unloadedParts = ([1, 2, 3, 4, 5] as WordPartNumber[]).filter((part) => !loadedWordParts.has(part));
    for (const part of unloadedParts) {
      await loadWordPart(part);
      entry = wordById.get(id);
      if (entry) break;
    }
  }

  return entry ? resolveWordEntry(entry) : undefined;
}

export async function getWordsForKanji(kanjiId: string): Promise<Word[]> {
  const kanji = KANJI_BY_ID.get(kanjiId);
  const wordIds = kanji?.wordIds ?? [];
  await loadWordPartsForIds(wordIds);

  return wordIds
    .map((wordId) => wordById.get(wordId)?.word)
    .filter((value): value is Word => Boolean(value));
}

export function getWordEntryColors(entry: WordEntry): [string, string] {
  const categoryColors = entry.kanji.map((kanji) => getLearningCategoryColors(kanji.learningCategory));
  const uniqueColors = Array.from(new Set(categoryColors.flat()));

  if (uniqueColors.length === 0) return ["#6b7280", "#4b5563"];
  if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];

  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}
