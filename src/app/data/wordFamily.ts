import type { Word, WordMetadataTag } from "../types";

export const WORD_VARIANT_TAGS = new Set<WordMetadataTag>([
  "iK",
  "ik",
  "io",
  "oK",
  "ok",
  "rK",
  "rk",
  "sk",
]);

const LEVEL_ONE_PRIORITIES = new Set(["news1", "ichi1", "spec1", "gai1"]);
const LEVEL_TWO_PRIORITIES = new Set(["news2", "ichi2", "spec2", "gai2"]);

const VARIANT_LABELS: Partial<Record<WordMetadataTag, string>> = {
  iK: "Irregular Kanji usage",
  ik: "Irregular Kana usage",
  io: "Irregular okurigana",
  oK: "Outdated Kanji form",
  ok: "Outdated Kana form",
  rK: "Rare Kanji form",
  rk: "Rare Kana form",
  sk: "Search-only form",
};

export interface WordFamily {
  id: string;
  primary: Word;
  variants: Word[];
}

export function getWordFamilyId(word: Word) {
  return word.source?.entryId ? `jmdict:${word.source.entryId}` : word.id ?? `word:${word.japanese}:${word.furigana}`;
}

export function isWordVariant(word: Word) {
  return word.wordTags?.some((tag) => WORD_VARIANT_TAGS.has(tag)) ?? false;
}

export function isCollapsibleWordFamily(words: Word[]) {
  if (words.length < 2) return false;
  const sourceEntryId = words[0].source?.entryId;
  return Boolean(sourceEntryId) && words.every((word) => word.source?.entryId === sourceEntryId);
}

function priorityKey(word: Word): [number, number] {
  const tags = word.priorityTags ?? [];
  const bucket = tags.some((tag) => LEVEL_ONE_PRIORITIES.has(tag))
    ? 0
    : tags.some((tag) => LEVEL_TWO_PRIORITIES.has(tag))
      ? 1
      : tags.some((tag) => tag.startsWith("nf"))
        ? 2
        : 3;
  const ranks = tags
    .filter((tag) => /^nf\d+$/.test(tag))
    .map((tag) => Number(tag.slice(2)));
  return [bucket, ranks.length ? Math.min(...ranks) : 999];
}

export function compareWordPreference(a: Word, b: Word) {
  const aPriority = priorityKey(a);
  const bPriority = priorityKey(b);
  return Number(isWordVariant(a)) - Number(isWordVariant(b))
    || aPriority[0] - bPriority[0]
    || aPriority[1] - bPriority[1]
    || (a.source?.spellingIndex ?? Number.MAX_SAFE_INTEGER) - (b.source?.spellingIndex ?? Number.MAX_SAFE_INTEGER)
    || (a.source?.readingIndex ?? Number.MAX_SAFE_INTEGER) - (b.source?.readingIndex ?? Number.MAX_SAFE_INTEGER)
    || a.japanese.localeCompare(b.japanese, "ja")
    || a.furigana.localeCompare(b.furigana, "ja");
}

export function selectPrimaryWord<T extends { word: Word }>(values: T[]) {
  return values.slice().sort((a, b) => compareWordPreference(a.word, b.word))[0];
}

export function groupWordsIntoFamilies(words: Word[]): WordFamily[] {
  const byFamily = new Map<string, Word[]>();
  for (const word of words) {
    const familyId = getWordFamilyId(word);
    const family = byFamily.get(familyId);
    if (family) family.push(word);
    else byFamily.set(familyId, [word]);
  }

  const families: WordFamily[] = [];
  for (const [familyId, members] of byFamily) {
    if (!isCollapsibleWordFamily(members)) {
      for (const member of members) {
        families.push({ id: member.id ?? familyId, primary: member, variants: [member] });
      }
      continue;
    }
    const variants = members.slice().sort(compareWordPreference);
    families.push({ id: familyId, primary: variants[0], variants });
  }
  return families;
}

export function getWordVariantLabel(word: Word, primary?: Word) {
  const labels = (word.wordTags ?? [])
    .map((tag) => VARIANT_LABELS[tag])
    .filter((label): label is string => Boolean(label));
  if (labels[0]) return labels[0];
  if (!primary) return "Alternative form";
  if (word.japanese === primary.japanese && word.furigana !== primary.furigana) return "Alternative reading";
  if (word.japanese !== primary.japanese && word.furigana === primary.furigana) return "Alternative spelling";
  return "Alternative form";
}

export function formatWordVariant(primary: Word, variant: Word) {
  if (variant.japanese === primary.japanese) return variant.furigana;
  if (variant.furigana === primary.furigana) return variant.japanese;
  return `${variant.japanese} (${variant.furigana})`;
}
