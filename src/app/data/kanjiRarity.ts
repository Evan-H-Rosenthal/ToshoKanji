import { KANJI } from "./generated/kanji.generated";
import type { KanjiEntry } from "../types";

export type KanjiRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface KanjiRarityInfo {
  id: KanjiRarity;
  label: string;
  color: string;
  color2: string;
  textColor: string;
  pullWeight: number;
}

export const KANJI_RARITIES: KanjiRarityInfo[] = [
  { id: "common", label: "Common", color: "#f8fafc", color2: "#94a3b8", textColor: "#111827", pullWeight: 40 },
  { id: "uncommon", label: "Uncommon", color: "#22c55e", color2: "#15803d", textColor: "#ffffff", pullWeight: 30 },
  { id: "rare", label: "Rare", color: "#3b82f6", color2: "#1d4ed8", textColor: "#ffffff", pullWeight: 18 },
  { id: "epic", label: "Epic", color: "#a855f7", color2: "#7e22ce", textColor: "#ffffff", pullWeight: 9 },
  { id: "legendary", label: "Legendary", color: "#facc15", color2: "#f59e0b", textColor: "#422006", pullWeight: 3 },
];

export const KANJI_RARITY_ORDER = KANJI_RARITIES.map((rarity) => rarity.id);

const RARITY_BY_ID = new Map(KANJI_RARITIES.map((rarity) => [rarity.id, rarity]));

const maxFrequency = Math.max(...KANJI.map((kanji) => kanji.frequency ?? 0), 1);
const maxStrokeCount = Math.max(...KANJI.map((kanji) => kanji.strokeCount ?? 0), 1);
const rarityByKanjiId = buildKanjiRarityMap(KANJI);

export function getKanjiRarity(kanji: KanjiEntry | undefined): KanjiRarity {
  if (!kanji) return "common";
  return rarityByKanjiId.get(kanji.id) ?? "common";
}

export function getKanjiRarityInfo(kanjiOrRarity: KanjiEntry | KanjiRarity | undefined): KanjiRarityInfo {
  const rarity = typeof kanjiOrRarity === "string" ? kanjiOrRarity : getKanjiRarity(kanjiOrRarity);
  return RARITY_BY_ID.get(rarity) ?? KANJI_RARITIES[0];
}

export function getKanjiRarityScore(kanji: KanjiEntry) {
  const gradeScore = scoreGrade(kanji.grade);
  const frequencyScore = kanji.frequency ? clamp01((kanji.frequency - 1) / Math.max(1, maxFrequency - 1)) : 0.86;
  const jlptScore = scoreOldJlpt(kanji.jlptOld);
  const strokeScore = kanji.strokeCount ? clamp01((kanji.strokeCount - 1) / Math.max(1, maxStrokeCount - 1)) : 0.42;

  return gradeScore * 0.56 + frequencyScore * 0.25 + jlptScore * 0.14 + strokeScore * 0.05;
}

function buildKanjiRarityMap(entries: KanjiEntry[]) {
  const ranked = [...entries].sort((a, b) => {
    return getKanjiRarityScore(b) - getKanjiRarityScore(a)
      || (b.grade ?? 99) - (a.grade ?? 99)
      || (b.strokeCount ?? 0) - (a.strokeCount ?? 0)
      || (b.frequency ?? 99999) - (a.frequency ?? 99999)
      || a.char.localeCompare(b.char);
  });
  const total = ranked.length;
  const legendaryCount = Math.round(total * 0.03);
  const epicCount = Math.round(total * 0.09);
  const rareCount = Math.round(total * 0.18);
  const uncommonCount = Math.round(total * 0.3);
  const map = new Map<string, KanjiRarity>();

  ranked.forEach((kanji, index) => {
    const rarity =
      index < legendaryCount ? "legendary"
        : index < legendaryCount + epicCount ? "epic"
          : index < legendaryCount + epicCount + rareCount ? "rare"
            : index < legendaryCount + epicCount + rareCount + uncommonCount ? "uncommon"
              : "common";
    map.set(kanji.id, rarity);
  });

  return map;
}

function scoreGrade(grade: number | undefined) {
  if (grade === undefined) return 0.88;
  if (grade <= 1) return 0;
  if (grade === 2) return 0.14;
  if (grade === 3) return 0.28;
  if (grade === 4) return 0.44;
  if (grade === 5) return 0.62;
  if (grade === 6) return 0.78;
  return 0.92;
}

function scoreOldJlpt(jlptOld: number | undefined) {
  if (jlptOld === undefined) return 0.62;
  if (jlptOld >= 4) return 0;
  if (jlptOld === 3) return 0.34;
  if (jlptOld === 2) return 0.68;
  return 1;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
