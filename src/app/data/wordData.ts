import { KANJI } from "./generated/kanji.generated";
import { WORDS } from "./generated/words.generated";
import { CAT_COLORS } from "./ui/categoryColors";
import type { KanjiEntry, Word, WordEntry as GeneratedWordEntry } from "../types";

export interface WordEntry {
  id: string;
  word: Word;
  kanji: KanjiEntry[];
}

const kanjiById = new Map(KANJI.map((kanji) => [kanji.id, kanji]));
const wordsByKanjiId = new Map<string, Word[]>();

function resolveWordEntry(entry: GeneratedWordEntry): WordEntry {
  const kanji = entry.kanjiIds
    .map((kanjiId) => kanjiById.get(kanjiId))
    .filter((value): value is KanjiEntry => Boolean(value));

  return { id: entry.id, word: entry.word, kanji };
}

export const WORD_ENTRIES = WORDS.map(resolveWordEntry);

for (const entry of WORDS) {
  for (const kanjiId of entry.kanjiIds) {
    const words = wordsByKanjiId.get(kanjiId) ?? [];
    words.push(entry.word);
    wordsByKanjiId.set(kanjiId, words);
  }
}

export function getWordEntries(): WordEntry[] {
  return WORD_ENTRIES;
}

export function findWordEntry(id: string): WordEntry | undefined {
  return WORD_ENTRIES.find((entry) => entry.id === id);
}

export function getWordsForKanji(kanjiId: string): Word[] {
  return wordsByKanjiId.get(kanjiId) ?? [];
}

export function getWordEntryColors(entry: WordEntry): [string, string] {
  const categoryColors = entry.kanji.map((kanji) => CAT_COLORS[kanji.category] ?? ["#6b7280", "#4b5563"]);
  const uniqueColors = Array.from(new Set(categoryColors.flat()));

  if (uniqueColors.length === 0) return ["#6b7280", "#4b5563"];
  if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];

  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}
