export type Tab = "collection" | "gacha" | "practice";
export type UiFontChoice = "nunito" | "system" | "new-rodin" | "two-weekend";
export type CharacterFontChoice = "traditional" | "modern" | "noto-sans";
export type WordReadingType = "on" | "kun" | "unusual";
export interface ScreenState { type: "main" | "kanji-entry" | "component-entry" | "word-entry" | "achievements" | "settings"; id?: string; }
export interface KanjiEntryViewState {
  scrollTop: number;
  wordBrowserScrollTop: number;
  wordQuery: string;
  wordReadingFilters: WordReadingType[];
}
export type WordMetadataTag = "ateji" | "gikun" | "iK" | "ik" | "io" | "oK" | "ok" | "rK" | "rk" | "sk";
export interface WordSense {
  index: number;
  glosses: string[];
  partsOfSpeech?: string[];
  fields?: string[];
  usageLabels?: string[];
  dialects?: string[];
  notes?: string[];
}
export interface WordSource {
  dataset: "JMdict_e";
  entryId: string;
  spellingIndex: number;
  readingIndex: number;
}
export interface Word {
  id?: string;
  japanese: string;
  furigana: string;
  romaji: string;
  romanizationStatus?: "unavailable";
  meaning: string;
  common?: boolean;
  wordTags?: WordMetadataTag[];
  priorityTags?: string[];
  information?: string[];
  usageLabels?: string[];
  senses?: WordSense[];
  source?: WordSource;
}
export type ComponentKind = "canonical-radical" | "radical-variant" | "visual-component" | "raw-fragment";
export type ComponentRepresentation = "official-radical" | "direct" | "alternate-glyph" | "image-glyph" | "image-label";
export interface KanjiPart {
  component: string;
  role: "official" | "component" | "raw-fragment";
  componentKind?: ComponentKind;
  componentId?: string;
  canonicalComponentId?: string;
  radicalId?: string;
  sourceComponent?: string;
  representation?: ComponentRepresentation;
  sourceImage?: string;
  alternateCode?: string;
  sourceStrokeCount?: number;
  hiddenReason?: "source-image-required" | "direct-self-membership" | string;
}
export interface OfficialRadical { id: string; char: string; form?: string; formSource?: string; positionedFormKnown?: boolean; }
export interface LearnerPart {
  char: string;
  label?: string;
  role: "official-radical" | "radical-variant" | "visual-component";
  componentId: string;
  radicalId?: string;
  source: "radical-metadata" | "radk-resolved" | string;
  sourceChar?: string;
  representation?: ComponentRepresentation;
  sourceImage?: string;
  alternateCode?: string;
  positionedFormKnown?: boolean;
  radicalFormEvidence?: string;
}
export interface RawPart {
  char: string;
  role: "raw-fragment" | "source-component" | "source-radical";
  radicalId?: string;
  componentId?: string;
  displayChar?: string;
  representation?: ComponentRepresentation;
  sourceImage?: string;
  alternateCode?: string;
  hiddenReason?: "source-image-required" | "direct-self-membership" | string;
  missingRadkMetadata?: boolean;
  debugOnly: true;
}
export interface RawDecomposition {
  source: "KRADFILE" | "KanjiVG" | string;
  parts: RawPart[];
  filteredParts?: string[];
  sourceComponents?: string[];
  unrenderableParts?: string[];
  hiddenSelfParts?: string[];
  interpretation?: string;
  confidence: "source-backed" | "low" | "medium" | "high" | string;
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
  hiddenSelfComponents?: string[];
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
  learningCategory: string;
}
export interface RadicalEntry {
  id: string;
  componentId?: string;
  char: string;
  meanings: string[];
  kanjiMeanings?: string[];
  characterMeanings?: string[];
  strokes: number;
  kanjiIds: string[];
  radicalNumber?: number;
  variants?: string[];
  names?: string[];
  source?: string;
}
export interface SourceCharacterInfo {
  char: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  grade?: number;
}
export interface ComponentEntry {
  id: string;
  char: string;
  kind: ComponentKind;
  canonicalComponentId?: string;
  radicalId?: string;
  radicalNumber?: number;
  meanings?: string[];
  characterMeanings?: string[];
  characterOnyomi?: string[];
  characterKunyomi?: string[];
  characterGrade?: number;
  forms?: string[];
  kanjiIds: string[];
  source: string;
  sourceChar?: string;
  sourceCharacter?: SourceCharacterInfo;
  representation?: ComponentRepresentation;
  sourceImage?: string;
  alternateCode?: string;
}
export interface WordEntry {
  id: string;
  word: Word;
  kanjiIds: string[];
  kanjiRanks?: number[];
}
export interface ChatMsg { role: "user" | "ai"; text: string; id: number; }
export type AchievementCategory = "rarity" | "category" | "favorites" | "notes" | "ai-chat";
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: AchievementCategory;
  check: (uk: Set<string>, ur: Set<string>, fav: Set<string>, notes: Record<string, string>, chatInteractions: number) => boolean;
}
