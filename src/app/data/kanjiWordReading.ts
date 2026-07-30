import { KANJI_BY_ID } from "./entryIndexes";
import type { KanjiEntry, Word, WordMetadataTag, WordReadingType } from "../types";

const UNUSUAL_WORD_TAGS = new Set<WordMetadataTag>([
  "ateji",
  "gikun",
  "iK",
  "ik",
  "io",
  "oK",
  "ok",
  "rK",
  "rk",
  "sk",
]);

const RENDAKU = new Map([
  ["\u304b", "\u304c"], ["\u304d", "\u304e"], ["\u304f", "\u3050"], ["\u3051", "\u3052"], ["\u3053", "\u3054"],
  ["\u3055", "\u3056"], ["\u3057", "\u3058"], ["\u3059", "\u305a"], ["\u305b", "\u305c"], ["\u305d", "\u305e"],
  ["\u305f", "\u3060"], ["\u3061", "\u3062"], ["\u3064", "\u3065"], ["\u3066", "\u3067"], ["\u3068", "\u3069"],
  ["\u306f", "\u3070"], ["\u3072", "\u3073"], ["\u3075", "\u3076"], ["\u3078", "\u3079"], ["\u307b", "\u307c"],
]);

const KANJI_BY_CHAR = new Map(Array.from(KANJI_BY_ID.values(), (entry) => [entry.char, entry]));

const READING_CANDIDATE_CACHE = new Map<string, Map<string, number>>();
function toHiragana(value: string) {
  return Array.from(value.normalize("NFKC"), (char) => {
    const codepoint = char.codePointAt(0) ?? 0;
    return codepoint >= 0x30a1 && codepoint <= 0x30f6
      ? String.fromCodePoint(codepoint - 0x60)
      : char;
  }).join("");
}

function isKana(char: string) {
  return /^[\u3041-\u3096\u30a1-\u30fa\u30fc]$/u.test(char);
}

function readingVariants(value: string) {
  const normalized = toHiragana(value).replace(/[.\-]/g, "");
  if (!normalized) return [];

  const variants = new Set([normalized]);
  const chars = Array.from(normalized);
  const voicedFirst = RENDAKU.get(chars[0]);
  if (voicedFirst) variants.add([voicedFirst, ...chars.slice(1)].join(""));

  for (const variant of Array.from(variants)) {
    if (/[\u304d\u304f\u3061\u3064]$/u.test(variant)) variants.add(`${variant.slice(0, -1)}\u3063`);
  }

  return Array.from(variants);
}

function readingCandidates(kanji: KanjiEntry) {
  const cached = READING_CANDIDATE_CACHE.get(kanji.id);
  if (cached) return cached;

  const candidates = new Map<string, number>();
  const add = (reading: string, mask: number) => {
    for (const variant of readingVariants(reading)) {
      candidates.set(variant, (candidates.get(variant) ?? 0) | mask);
    }
  };

  kanji.onyomi.forEach((reading) => add(reading, 1));
  kanji.kunyomi.forEach((reading) => add(reading.split(".", 1)[0], 2));
  READING_CANDIDATE_CACHE.set(kanji.id, candidates);
  return candidates;
}

function classifyByReading(kanji: KanjiEntry, word: Word): WordReadingType {
  const written = Array.from(word.japanese);
  const reading = toHiragana(word.furigana);
  if (!reading || !written.includes(kanji.char)) return "unusual";

  const memo = new Map<string, Set<number>>();
  const walk = (writtenIndex: number, readingIndex: number, targetMask: number): Set<number> => {
    const memoKey = `${writtenIndex}:${readingIndex}:${targetMask}`;
    const cached = memo.get(memoKey);
    if (cached) return cached;

    const results = new Set<number>();
    memo.set(memoKey, results);
    if (writtenIndex === written.length) {
      if (readingIndex === reading.length && targetMask) results.add(targetMask);
      return results;
    }
    if (readingIndex >= reading.length) return results;

    const char = written[writtenIndex];
    if (isKana(char)) {
      const kana = toHiragana(char);
      if (reading.startsWith(kana, readingIndex)) {
        for (const mask of walk(writtenIndex + 1, readingIndex + kana.length, targetMask)) results.add(mask);
      }
      return results;
    }

    const entry = KANJI_BY_CHAR.get(char);
    if (entry) {
      for (const [candidate, candidateMask] of readingCandidates(entry)) {
        if (!reading.startsWith(candidate, readingIndex)) continue;
        const nextMask = char === kanji.char ? targetMask | candidateMask : targetMask;
        for (const mask of walk(writtenIndex + 1, readingIndex + candidate.length, nextMask)) results.add(mask);
      }
      return results;
    }

    const remainingWritten = written.length - writtenIndex - 1;
    const maxLength = Math.min(6, reading.length - readingIndex - remainingWritten);
    for (let length = 1; length <= maxLength; length += 1) {
      for (const mask of walk(writtenIndex + 1, readingIndex + length, targetMask)) results.add(mask);
    }
    return results;
  };

  const masks = walk(0, 0, 0);
  const combinedMask = Array.from(masks).reduce((combined, mask) => combined | mask, 0);
  if (combinedMask === 1) return "on";
  if (combinedMask === 2) return "kun";

  const targetCandidates = readingCandidates(kanji);
  let fallbackMask = 0;
  for (const [candidate, mask] of targetCandidates) {
    if (reading.includes(candidate)) fallbackMask |= mask;
  }
  if (fallbackMask === 1) return "on";
  if (fallbackMask === 2) return "kun";
  return "unusual";
}

export function getKanjiWordReadingType(kanji: KanjiEntry, word: Word): WordReadingType {
  if (word.wordTags?.some((tag) => UNUSUAL_WORD_TAGS.has(tag))) return "unusual";
  return classifyByReading(kanji, word);
}
