export type Tab = "collection" | "gacha" | "practice";
export type UiFontChoice = "nunito" | "system";
export type CharacterFontChoice = "traditional" | "modern";
export interface ScreenState { type: "main" | "kanji-entry" | "radical-entry" | "word-entry" | "achievements" | "settings"; id?: string; }
export interface Word { id?: string; japanese: string; furigana: string; romaji: string; meaning: string; common?: boolean; }
export interface KanjiPart { component: string; role: string; radicalId?: string; }
export interface OfficialRadical { id: string; form: string; char: string; }
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
  components?: string[];
  componentIds?: string[];
  kanjiParts?: KanjiPart[];
  wordIds?: string[];
  words: Word[];
  category: string;
}
export interface RadicalEntry {
  id: string;
  char: string;
  meanings: string[];
  kanjiMeanings?: string[];
  strokes: number;
  kanjiIds: string[];
  radicalNumber?: number;
  variants?: string[];
  names?: string[];
}
export interface ChatMsg { role: "user" | "ai"; text: string; id: number; }
export interface Achievement { id: string; name: string; desc: string; icon: string; check: (uk: Set<string>, ur: Set<string>, fav: Set<string>, notes: Record<string, string>) => boolean; }
