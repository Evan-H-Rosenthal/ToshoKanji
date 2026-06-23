import { CAT_COLORS, KANJI } from "./kanjiData";
import type { KanjiEntry, Word } from "../types";

export interface WordEntry {
  id: string;
  word: Word;
  kanji: KanjiEntry[];
}

function buildWordEntries(): WordEntry[] {
  const byId = new Map<string, WordEntry>();

  for (const kanji of KANJI) {
    for (const word of kanji.words) {
      const id = word.id || `w-${word.japanese}`;
      const existing = byId.get(id);
      const kanjiInWord = KANJI.filter((entry) => word.japanese.includes(entry.char));

      if (existing) {
        for (const wordKanji of kanjiInWord) {
          if (!existing.kanji.some((entry) => entry.id === wordKanji.id)) {
            existing.kanji.push(wordKanji);
          }
        }
        continue;
      }

      byId.set(id, { id, word: { ...word, id }, kanji: kanjiInWord.length ? kanjiInWord : [kanji] });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.word.japanese.localeCompare(b.word.japanese, "ja"));
}

export const WORD_ENTRIES = buildWordEntries();

export function getWordEntries(): WordEntry[] {
  return WORD_ENTRIES;
}

export function findWordEntry(id: string): WordEntry | undefined {
  return WORD_ENTRIES.find((entry) => entry.id === id);
}

export function getWordEntryColors(entry: WordEntry): [string, string] {
  const categoryColors = entry.kanji.map((kanji) => CAT_COLORS[kanji.category] ?? ["#6b7280", "#4b5563"]);
  const uniqueColors = Array.from(new Set(categoryColors.flat()));

  if (uniqueColors.length === 0) return ["#6b7280", "#4b5563"];
  if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];

  return [uniqueColors[0], uniqueColors[uniqueColors.length - 1]];
}
