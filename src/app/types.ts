export type Tab = "collection" | "gacha" | "practice";
export type UiFontChoice = "nunito" | "system";
export type CharacterFontChoice = "traditional" | "modern";
export interface ScreenState { type: "main" | "kanji-entry" | "radical-entry" | "component-entry" | "word-entry" | "achievements" | "settings"; id?: string; }
export interface Word { id?: string; japanese: string; furigana: string; romaji: string; meaning: string; common?: boolean; }
export interface KanjiPart { component: string; role: string; componentId?: string; radicalId?: string; }
export interface OfficialRadical { id: string; form: string; char: string; }
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
  kind: "radical" | "radical-variant" | "component";
  radicalId?: string;
  radicalNumber?: number;
  meanings?: string[];
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
