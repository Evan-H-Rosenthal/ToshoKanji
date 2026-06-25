import { KANJI } from "./generated/kanji.generated";
import { WORDS } from "./generated/words.generated";
import { getLearningCategoryColors } from "./ui/categoryColors";
import type { KanjiEntry, Word, WordEntry as GeneratedWordEntry } from "../types";

export interface WordEntry {
  id: string;
  word: Word;
  kanji: KanjiEntry[];
}

const kanjiById = new Map(KANJI.map((kanji) => [kanji.id, kanji]));
const wordById = new Map(WORDS.map((entry) => [entry.id, entry.word]));

function resolveWordEntry(entry: GeneratedWordEntry): WordEntry {
  const kanji = entry.kanjiIds
    .map((kanjiId) => kanjiById.get(kanjiId))
    .filter((value): value is KanjiEntry => Boolean(value));

  return { id: entry.id, word: entry.word, kanji };
}

export const WORD_ENTRIES = WORDS.map(resolveWordEntry);

export function getWordEntries(): WordEntry[] {
  return WORD_ENTRIES;
}

export function findWordEntry(id: string): WordEntry | undefined {
  return WORD_ENTRIES.find((entry) => entry.id === id);
}

export function getWordsForKanji(kanjiId: string): Word[] {
  const kanji = kanjiById.get(kanjiId);
  return (kanji?.wordIds ?? [])
    .map((wordId) => wordById.get(wordId))
    .filter((value): value is Word => Boolean(value));
}

export function getWordEntryColors(entry: WordEntry): [string, string] {
  const categoryColors = entry.kanji.map((kanji) => getLearningCategoryColors(kanji.learningCategory));
  const uniqueColors = Array.from(new Set(categoryColors.flat()));

  if (uniqueColors.length === 0) return ["#6b7280", "#4b5563"];
  if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];

  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}
