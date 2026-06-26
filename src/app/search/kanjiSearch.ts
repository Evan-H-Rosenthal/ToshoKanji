import type { KanjiEntry, Word } from "../types";
import type { WordEntry } from "../data/wordData";
import { getLearningCategoryLabel } from "../data/ui/categoryColors";

export type MatchReasonKind = "kanji" | "word" | "reading" | "meaning" | "category" | "component" | "name";

export interface SearchMatchReason {
  kind: MatchReasonKind;
  value: string;
}

export interface KanjiSearchResult {
  kanji: KanjiEntry;
  score: number;
  reason?: SearchMatchReason;
}

export interface WordSearchResult {
  entry: WordEntry;
  score: number;
  reason?: SearchMatchReason;
}

interface SearchField {
  kind: MatchReasonKind;
  value: string;
  normalized: string;
  kanaNormalized: string;
  score: number;
}

interface KanjiRecord {
  kanji: KanjiEntry;
  fields: SearchField[];
  componentFields: SearchField[];
}

interface WordRecord {
  entry: WordEntry;
  fields: SearchField[];
  kanjiIds: string[];
}

export interface KanjiSearchIndex {
  kanjiRecords: KanjiRecord[];
  wordRecords: WordRecord[];
}

export interface SearchKanjiIndexOptions {
  unlockedKanji?: Set<string>;
  favorites?: Set<string>;
  customNames?: Record<string, string>;
  includeWords?: boolean;
  includeComponents?: boolean;
  maxKanjiResults?: number;
  maxWordResults?: number;
}

const SCORE = {
  exactKanji: 1000,
  exactWord: 880,
  exactReading: 760,
  exactMeaning: 640,
  exactCategory: 600,
  exactComponent: 540,
  partialReading: 430,
  partialWord: 390,
  partialMeaning: 330,
  partialCategory: 310,
  partialComponent: 280,
  partialName: 260,
};

const FAVORITE_BOOST = 18;
const UNLOCKED_BOOST = 8;
const COMMON_WORD_BOOST = 8;

export function buildKanjiSearchIndex(kanjiEntries: KanjiEntry[], wordEntries: WordEntry[]): KanjiSearchIndex {
  const kanjiRecords = kanjiEntries.map((kanji) => ({
    kanji,
    fields: buildKanjiFields(kanji),
    componentFields: buildKanjiComponentFields(kanji),
  }));
  const wordRecords = wordEntries.map((entry) => ({
    entry,
    fields: buildWordFields(entry.word),
    kanjiIds: entry.kanji.map((kanji) => kanji.id),
  }));

  return { kanjiRecords, wordRecords };
}

export function searchKanjiIndex(
  index: KanjiSearchIndex,
  query: string,
  options: SearchKanjiIndexOptions = {},
): { kanjiResults: KanjiSearchResult[]; wordResults: WordSearchResult[] } {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return {
      kanjiResults: index.kanjiRecords
        .filter((record) => !options.unlockedKanji || options.unlockedKanji.has(record.kanji.id))
        .map((record) => ({ kanji: record.kanji, score: 0 })),
      wordResults: [],
    };
  }

  const kanaQuery = normalizeKana(normalizedQuery);
  const customNames = options.customNames ?? {};
  const maxWordResults = options.maxWordResults ?? 80;
  const kanjiResultsById = new Map<string, KanjiSearchResult>();
  for (const record of index.kanjiRecords) {
    const result = scoreKanjiRecord(record, normalizedQuery, kanaQuery, options.favorites, options.unlockedKanji, customNames, options.includeComponents === true);
    if (result) kanjiResultsById.set(record.kanji.id, result);
  }

  const wordResults: WordSearchResult[] = [];
  const recordsToScan = options.includeWords === false ? [] : index.wordRecords;
  for (const record of recordsToScan) {
    const wordResult = scoreWordRecord(record, normalizedQuery, kanaQuery, options.favorites, options.unlockedKanji);
    if (!wordResult) continue;

    insertTopWordResult(wordResults, wordResult, maxWordResults);

    for (const kanji of wordResult.entry.kanji) {
      if (options.unlockedKanji && !options.unlockedKanji.has(kanji.id)) continue;

      const propagatedScore = wordResult.score - 24 + frequencyBoost(kanji);
      const existing = kanjiResultsById.get(kanji.id);
      if (!existing || propagatedScore > existing.score) {
        kanjiResultsById.set(kanji.id, {
          kanji,
          score: propagatedScore,
          reason: wordResult.reason,
        });
      }
    }
  }

  return {
    kanjiResults: Array.from(kanjiResultsById.values()).sort(compareKanjiResults).slice(0, options.maxKanjiResults ?? 120),
    wordResults,
  };
}

export function normalizeSearchText(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

function buildKanjiFields(kanji: KanjiEntry): SearchField[] {
  const categoryLabel = getLearningCategoryLabel(kanji.learningCategory);

  return [
    makeField("kanji", kanji.char, SCORE.exactKanji),
    ...kanji.meanings.map((meaning) => makeField("meaning", meaning, SCORE.exactMeaning)),
    ...kanji.onyomi.map((reading) => makeField("reading", reading, SCORE.exactReading)),
    ...kanji.kunyomi.map((reading) => makeField("reading", reading, SCORE.exactReading)),
    makeField("category", categoryLabel, SCORE.exactCategory),
    makeField("category", kanji.learningCategory, SCORE.exactCategory),
  ];
}

function buildKanjiComponentFields(kanji: KanjiEntry): SearchField[] {
  const components = new Set<string>();

  kanji.components?.forEach((component) => components.add(component));
  kanji.rawComponents?.forEach((component) => components.add(component));
  kanji.visibleComponents?.forEach((part) => components.add(part.component));
  kanji.kanjiParts?.forEach((part) => components.add(part.component));
  kanji.learnerParts?.forEach((part) => components.add(part.char));

  return Array.from(components).map((component) => makeField("component", component, SCORE.exactComponent));
}

function buildWordFields(word: Word): SearchField[] {
  return [
    makeField("word", word.japanese, SCORE.exactWord),
    makeField("reading", word.furigana, SCORE.exactReading),
    makeField("meaning", word.meaning, SCORE.exactMeaning),
  ];
}

function makeField(kind: MatchReasonKind, value: string | undefined, score: number): SearchField {
  const normalized = normalizeSearchText(value ?? "");
  return {
    kind,
    value: value ?? "",
    normalized,
    kanaNormalized: normalizeKana(normalized),
    score,
  };
}

function scoreKanjiRecord(
  record: KanjiRecord,
  query: string,
  kanaQuery: string,
  favorites?: Set<string>,
  unlockedKanji?: Set<string>,
  customNames?: Record<string, string>,
  includeComponents = false,
): KanjiSearchResult | null {
  if (unlockedKanji && !unlockedKanji.has(record.kanji.id)) return null;

  const key = `kanji:${record.kanji.id}`;
  const customName = customNames?.[key];
  const fields = [
    ...record.fields,
    ...(includeComponents ? record.componentFields : []),
    ...(customName ? [makeField("name", customName, SCORE.partialName)] : []),
  ];
  const best = bestFieldMatch(fields, query, kanaQuery);
  if (!best) return null;

  const favoriteBoost = favorites?.has(key) ? FAVORITE_BOOST : 0;
  const unlockedBoost = unlockedKanji?.has(record.kanji.id) ? UNLOCKED_BOOST : 0;
  return {
    kanji: record.kanji,
    score: best.score + favoriteBoost + unlockedBoost + frequencyBoost(record.kanji),
    reason: { kind: best.field.kind, value: best.field.value },
  };
}

function scoreWordRecord(
  record: WordRecord,
  query: string,
  kanaQuery: string,
  favorites?: Set<string>,
  unlockedKanji?: Set<string>,
): WordSearchResult | null {
  if (unlockedKanji && !record.kanjiIds.some((kanjiId) => unlockedKanji.has(kanjiId))) return null;

  const best = bestFieldMatch(record.fields, query, kanaQuery);
  if (!best) return null;

  return {
    entry: record.entry,
    score: best.score + (favorites?.has(`word:${record.entry.id}`) ? FAVORITE_BOOST : 0) + (record.entry.word.common ? COMMON_WORD_BOOST : 0),
    reason: { kind: best.field.kind, value: best.field.value },
  };
}

function bestFieldMatch(fields: SearchField[], query: string, kanaQuery: string): { field: SearchField; score: number } | null {
  let best: { field: SearchField; score: number } | null = null;
  const allowPartial = !isSingleAsciiQuery(query);

  for (const field of fields) {
    if (!field.normalized) continue;

    const exact = field.normalized === query || field.kanaNormalized === kanaQuery;
    const partial = allowPartial && !exact && (field.normalized.includes(query) || field.kanaNormalized.includes(kanaQuery));
    if (!exact && !partial) continue;

    const score = exact ? field.score : getPartialScore(field.kind);
    if (!best || score > best.score || (score === best.score && field.value.length < best.field.value.length)) {
      best = { field, score };
    }
  }

  return best;
}

function insertTopWordResult(results: WordSearchResult[], result: WordSearchResult, maxResults: number) {
  if (maxResults <= 0) return;

  const existingIndex = results.findIndex((existing) => existing.entry.id === result.entry.id);
  if (existingIndex >= 0) {
    if (compareWordResults(result, results[existingIndex]) < 0) results[existingIndex] = result;
    else return;
  } else if (results.length < maxResults) {
    results.push(result);
  } else if (compareWordResults(result, results[results.length - 1]) < 0) {
    results[results.length - 1] = result;
  } else {
    return;
  }

  results.sort(compareWordResults);
}

function isSingleAsciiQuery(query: string) {
  return /^[a-z0-9]$/i.test(query);
}

function getPartialScore(kind: MatchReasonKind) {
  if (kind === "reading") return SCORE.partialReading;
  if (kind === "word") return SCORE.partialWord;
  if (kind === "meaning") return SCORE.partialMeaning;
  if (kind === "category") return SCORE.partialCategory;
  if (kind === "component") return SCORE.partialComponent;
  if (kind === "name") return SCORE.partialName;
  return SCORE.exactKanji;
}

function normalizeKana(value: string) {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) return String.fromCharCode(code - 0x60);
    return char;
  }).join("");
}

function frequencyBoost(kanji: KanjiEntry) {
  if (!kanji.frequency) return 0;
  return Math.max(0, 12 - Math.floor(kanji.frequency / 250));
}

function compareKanjiResults(a: KanjiSearchResult, b: KanjiSearchResult) {
  return b.score - a.score
    || (a.kanji.frequency ?? 99999) - (b.kanji.frequency ?? 99999)
    || a.kanji.char.localeCompare(b.kanji.char);
}

function compareWordResults(a: WordSearchResult, b: WordSearchResult) {
  return b.score - a.score
    || Number(Boolean(b.entry.word.common)) - Number(Boolean(a.entry.word.common))
    || a.entry.word.japanese.localeCompare(b.entry.word.japanese);
}
