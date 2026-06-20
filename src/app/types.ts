export type Tab = "kanji" | "gacha" | "radicals";
export interface ScreenState { type: "main" | "kanji-entry" | "radical-entry" | "achievements" | "settings"; id?: string; }
export interface Word { japanese: string; furigana: string; romaji: string; meaning: string; }
export interface KanjiEntry { id: string; char: string; meanings: string[]; onyomi: string[]; kunyomi: string[]; radicalIds: string[]; words: Word[]; category: string; }
export interface RadicalEntry { id: string; char: string; meanings: string[]; strokes: number; kanjiIds: string[]; }
export interface ChatMsg { role: "user" | "ai"; text: string; id: number; }
export interface Achievement { id: string; name: string; desc: string; icon: string; check: (uk: Set<string>, ur: Set<string>, fav: Set<string>, notes: Record<string, string>) => boolean; }
