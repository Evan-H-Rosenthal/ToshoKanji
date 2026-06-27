export type Tab = "collection" | "gacha" | "practice";
export type UiFontChoice = "nunito" | "system";
export type CharacterFontChoice = "traditional" | "modern";
export interface ScreenState { type: "main" | "kanji-entry" | "component-entry" | "word-entry" | "achievements" | "settings"; id?: string; }
export type WordMetadataTag = "ateji" | "gikun" | "iK" | "ik" | "io" | "oK" | "ok" | "rK" | "rk" | "sk";
export interface Word { id?: string; japanese: string; furigana: string; romaji: string; meaning: string; common?: boolean; wordTags?: WordMetadataTag[]; }
export interface KanjiPart { component: string; role: string; componentId?: string; radicalId?: string; }
export interface OfficialRadical { id: string; form: string; char: string; }
export interface LearnerPart {
  char: string;
  label?: string;
  role: "official-radical" | "semantic" | "phonetic" | "learner-component";
  componentId?: string;
  radicalId?: string;
  source: "manual" | "radical-metadata" | "normalized-krad" | string;
}
export interface RawPart {
  char: string;
  role: "raw-fragment" | "source-component" | "source-radical";
  radicalId?: string;
  componentId?: string;
  debugOnly: true;
}
export interface RawDecomposition {
  source: "KRADFILE" | "KanjiVG" | string;
  parts: RawPart[];
  filteredParts: string[];
  confidence: "low" | "medium" | "high" | string;
}
export interface EtymologyNote {
  summary: string;
  source?: string;
  confidence?: "low" | "medium" | "high" | string;
  notes?: string[];
}
export interface ComponentProvenance {
  source: string;
  extractionMethod: string;
  confidence: "low" | "medium" | "high" | string;
  rawComponentCount?: number;
  visibleComponentCount?: number;
  filteredComponents?: string[];
}
export interface KanjiEntry {
  id: string;
  literal?: string;
  char: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  strokeCount?: number;
  grade?: number;
  frequency?: number;
  jlptOld?: number;
  officialRadical?: OfficialRadical;
  radicalIds: string[];
  radicalForms?: Record<string, string>;
  learnerParts?: LearnerPart[];
  rawDecomposition?: RawDecomposition;
  etymology?: EtymologyNote;
  visibleComponents?: KanjiPart[];
  rawComponents?: string[];
  componentProvenance?: ComponentProvenance;
  components?: string[];
  componentIds?: string[];
  kanjiParts?: KanjiPart[];
  rawKanjiParts?: KanjiPart[];
  wordIds?: string[];
  words?: Word[];
  category: string;
  learningCategory: string;
}
export interface RadicalEntry {
  id: string;
  componentId?: string;
  char: string;
  meanings: string[];
  kanjiMeanings?: string[];
  strokes: number;
  kanjiIds: string[];
  radicalNumber?: number;
  variants?: string[];
  names?: string[];
}
export interface ComponentEntry {
  id: string;
  char: string;
  kind: "canonical-radical" | "radical-variant" | "learner-component" | "raw-fragment";
  canonicalComponentId?: string;
  radicalId?: string;
  radicalNumber?: number;
  meanings?: string[];
  forms?: string[];
  kanjiIds: string[];
  source: string;
}
export interface WordEntry {
  id: string;
  word: Word;
  kanjiIds: string[];
}
export interface ChatMsg { role: "user" | "ai"; text: string; id: number; }
export interface Achievement { id: string; name: string; desc: string; icon: string; check: (uk: Set<string>, ur: Set<string>, fav: Set<string>, notes: Record<string, string>) => boolean; }
