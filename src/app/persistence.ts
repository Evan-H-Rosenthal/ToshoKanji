import type { CharacterFontChoice, UiFontChoice } from "./types";

const STORAGE_KEY = "toshokanji:app-state";
const CURRENT_VERSION = 1;

export interface PersistedAppState {
  version: 1;
  unlockedKanji: string[];
  unlockedRadicals: string[];
  favorites: string[];
  customNames: Record<string, string>;
  notes: Record<string, string>;
  settings: {
    darkMode: boolean;
    volume: number;
    disableAutoJump: boolean;
    improvePerformance: boolean;
    uiFontChoice: UiFontChoice;
    characterFontChoice: CharacterFontChoice;
  };
}

export interface HydratedAppState {
  unlockedKanji: Set<string>;
  unlockedRadicals: Set<string>;
  favorites: Set<string>;
  customNames: Record<string, string>;
  notes: Record<string, string>;
  settings: PersistedAppState["settings"];
}

const DEFAULT_SETTINGS: PersistedAppState["settings"] = {
  darkMode: true,
  volume: 0.7,
  disableAutoJump: false,
  improvePerformance: false,
  uiFontChoice: "nunito",
  characterFontChoice: "traditional",
};

export function loadPersistedAppState(): HydratedAppState {
  if (typeof window === "undefined") return emptyHydratedState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyHydratedState();

    const parsed = JSON.parse(raw);
    if (!isObject(parsed) || parsed.version !== CURRENT_VERSION) return emptyHydratedState();

    return {
      unlockedKanji: new Set(readStringArray(parsed.unlockedKanji)),
      unlockedRadicals: new Set(readStringArray(parsed.unlockedRadicals)),
      favorites: new Set(readStringArray(parsed.favorites)),
      customNames: readStringRecord(parsed.customNames),
      notes: readStringRecord(parsed.notes),
      settings: {
        darkMode: typeof parsed.settings?.darkMode === "boolean" ? parsed.settings.darkMode : DEFAULT_SETTINGS.darkMode,
        volume: readVolume(parsed.settings?.volume),
        disableAutoJump: typeof parsed.settings?.disableAutoJump === "boolean"
          ? parsed.settings.disableAutoJump
          : DEFAULT_SETTINGS.disableAutoJump,
        improvePerformance: typeof parsed.settings?.improvePerformance === "boolean"
          ? parsed.settings.improvePerformance
          : DEFAULT_SETTINGS.improvePerformance,
        uiFontChoice: readUiFontChoice(parsed.settings?.uiFontChoice),
        characterFontChoice: readCharacterFontChoice(parsed.settings?.characterFontChoice),
      },
    };
  } catch {
    return emptyHydratedState();
  }
}

export function savePersistedAppState(state: HydratedAppState) {
  if (typeof window === "undefined") return;

  const payload: PersistedAppState = {
    version: CURRENT_VERSION,
    unlockedKanji: Array.from(state.unlockedKanji),
    unlockedRadicals: Array.from(state.unlockedRadicals),
    favorites: Array.from(state.favorites),
    customNames: state.customNames,
    notes: state.notes,
    settings: state.settings,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota/private-mode failures. The app can still run without persistence.
  }
}

function emptyHydratedState(): HydratedAppState {
  return {
    unlockedKanji: new Set(),
    unlockedRadicals: new Set(),
    favorites: new Set(),
    customNames: {},
    notes: {},
    settings: DEFAULT_SETTINGS,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function readVolume(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : DEFAULT_SETTINGS.volume;
}

function readUiFontChoice(value: unknown): UiFontChoice {
  return value === "system" || value === "nunito" ? value : DEFAULT_SETTINGS.uiFontChoice;
}

function readCharacterFontChoice(value: unknown): CharacterFontChoice {
  return value === "modern" || value === "traditional" ? value : DEFAULT_SETTINGS.characterFontChoice;
}
