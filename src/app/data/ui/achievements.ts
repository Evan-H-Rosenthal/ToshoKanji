import type { Achievement } from "../../types";
import { KANJI } from "../generated/kanji.generated";
import { KANJI_BY_RARITY, KANJI_IDS_BY_CATEGORY } from "../entryIndexes";
import { KANJI_RARITIES, type KanjiRarity } from "../kanjiRarity";
import { LEARNING_CATEGORIES } from "./categoryColors";

const RARITY_TEN_ACHIEVEMENTS: Partial<Record<KanjiRarity, Pick<Achievement, "id" | "name" | "desc" | "icon">>> = {
  common: { id: "rarity-common-10", name: "My Ordinary Life", desc: "Unlock 10 Common Kanji", icon: "🍚" },
  uncommon: { id: "rarity-uncommon-10", name: "Unc(ommon) Status", desc: "Unlock 10 Uncommon Kanji", icon: "🧩" },
  rare: { id: "rarity-rare-10", name: "Rareing to Go", desc: "Unlock 10 Rare Kanji", icon: "🖌️" },
  epic: { id: "rarity-epic-10", name: "Pop Team", desc: "Unlock 10 Epic Kanji", icon: "🍆" },
  legendary: { id: "rarity-legendary-10", name: "Densetsu No Kanji", desc: "Unlock 10 Legendary Kanji", icon: "🥇" },
};

const CATEGORY_START_ACHIEVEMENTS: Record<string, Pick<Achievement, "id" | "name" | "desc" | "icon">> = {
  Nature: { id: "category-nature-1", name: "Touch Grass", desc: "Unlock a Nature Kanji", icon: "🎋" },
  PeopleSociety: { id: "category-people-society-1", name: "Social Interaction", desc: "Unlock a People & Society Kanji", icon: "🙆" },
  PlacesBuildings: { id: "category-places-buildings-1", name: "All Around Me Are", desc: "Unlock a Places & Buildings Kanji", icon: "📍" },
};

const FAVORITE_ACHIEVEMENTS: Array<Pick<Achievement, "id" | "name" | "desc" | "icon"> & { count: number }> = [
  { id: "favorite-1", name: "Good Noodle", desc: "Favorite one entry", icon: "🌟", count: 1 },
  { id: "favorite-10", name: "Favoriteer", desc: "Favorite 10 entries", icon: "💫", count: 10 },
  { id: "favorite-30", name: "The Original Starman", desc: "Favorite 30 entries", icon: "🎖️", count: 30 },
];

const NOTE_ACHIEVEMENTS = [1, 10, 50].map((count) => ({
  id: `notes-${count}`,
  name: `Placeholder: Notes ${count}`,
  desc: `Write notes on ${count} ${count === 1 ? "entry" : "entries"}`,
  icon: "❔",
  count,
}));

function unlockedKanjiCount(unlockedKanji: Set<string>, kanjiIds: string[]) {
  return kanjiIds.reduce((count, kanjiId) => count + (unlockedKanji.has(kanjiId) ? 1 : 0), 0);
}

function hasUnlockedHalf(unlockedKanji: Set<string>, kanjiIds: string[]) {
  return kanjiIds.length > 0 && unlockedKanjiCount(unlockedKanji, kanjiIds) >= Math.ceil(kanjiIds.length / 2);
}

function hasUnlockedAll(unlockedKanji: Set<string>, kanjiIds: string[]) {
  return kanjiIds.length > 0 && kanjiIds.every((kanjiId) => unlockedKanji.has(kanjiId));
}

function placeholderId(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function noteCount(notes: Record<string, string>) {
  return Object.values(notes).filter((note) => note.trim().length > 0).length;
}

const rarityTenAchievements = KANJI_RARITIES.flatMap((rarity): Achievement[] => {
  const achievement = RARITY_TEN_ACHIEVEMENTS[rarity.id];
  const entries = KANJI_BY_RARITY.get(rarity.id) ?? [];
  if (!achievement) return [];
  return [{
    ...achievement,
    check: (unlockedKanji) => unlockedKanjiCount(unlockedKanji, entries.map((entry) => entry.id)) >= 10,
  }];
});

const rarityHalfAchievements: Achievement[] = KANJI_RARITIES.map((rarity) => {
  const entries = KANJI_BY_RARITY.get(rarity.id) ?? [];
  const kanjiIds = entries.map((entry) => entry.id);
  return {
    id: `rarity-${rarity.id}-half`,
    name: `Placeholder: Half ${rarity.label}`,
    desc: `Unlock half of ${rarity.label} Kanji`,
    icon: "❔",
    check: (unlockedKanji) => hasUnlockedHalf(unlockedKanji, kanjiIds),
  };
});

const rarityCompleteAchievements: Achievement[] = KANJI_RARITIES.map((rarity) => {
  const entries = KANJI_BY_RARITY.get(rarity.id) ?? [];
  const kanjiIds = entries.map((entry) => entry.id);
  return {
    id: `rarity-${rarity.id}-complete`,
    name: `Placeholder: Complete ${rarity.label}`,
    desc: `Unlock every ${rarity.label} Kanji`,
    icon: "❔",
    check: (unlockedKanji) => hasUnlockedAll(unlockedKanji, kanjiIds),
  };
});

const categoryStartAchievements: Achievement[] = LEARNING_CATEGORIES.map((category) => {
  const achievement = CATEGORY_START_ACHIEVEMENTS[category.id] ?? {
    id: `category-${placeholderId(category.id)}-1`,
    name: `Placeholder: ${category.label} Starter`,
    desc: `Unlock a ${category.label} Kanji`,
    icon: "❔",
  };
  const kanjiIds = KANJI_IDS_BY_CATEGORY.get(category.id) ?? [];
  return {
    ...achievement,
    check: (unlockedKanji) => unlockedKanjiCount(unlockedKanji, kanjiIds) >= 1,
  };
});

const categoryHalfAchievements: Achievement[] = LEARNING_CATEGORIES.map((category) => {
  const kanjiIds = KANJI_IDS_BY_CATEGORY.get(category.id) ?? [];
  return {
    id: `category-${placeholderId(category.id)}-half`,
    name: `Placeholder: Half ${category.label}`,
    desc: `Unlock half of ${category.label} Kanji`,
    icon: "❔",
    check: (unlockedKanji) => hasUnlockedHalf(unlockedKanji, kanjiIds),
  };
});

const categoryCompleteAchievements: Achievement[] = LEARNING_CATEGORIES.map((category) => {
  const kanjiIds = KANJI_IDS_BY_CATEGORY.get(category.id) ?? [];
  return {
    id: `category-${placeholderId(category.id)}-complete`,
    name: `Placeholder: Complete ${category.label}`,
    desc: `Unlock every ${category.label} Kanji`,
    icon: "❔",
    check: (unlockedKanji) => hasUnlockedAll(unlockedKanji, kanjiIds),
  };
});

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-k", name: "Just Starting Out", desc: "Unlock your first Kanji", icon: "🌱", check: (unlockedKanji) => unlockedKanji.size >= 1 },
  ...rarityTenAchievements,
  ...rarityHalfAchievements,
  ...rarityCompleteAchievements,
  { id: "half", name: "Livin' on a Prayer", desc: "Unlock half of all Kanji", icon: "🌓", check: (unlockedKanji) => unlockedKanji.size >= Math.ceil(KANJI.length / 2) },
  { id: "all-k", name: "Classroom Assassinator", desc: "Unlock all the Kanji", icon: "🎓", check: (unlockedKanji) => unlockedKanji.size >= KANJI.length },
  ...categoryStartAchievements,
  ...categoryHalfAchievements,
  ...categoryCompleteAchievements,
  ...FAVORITE_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    check: (_unlockedKanji, _unlockedRadicals, favorites) => favorites.size >= achievement.count,
  })),
  ...NOTE_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    check: (_unlockedKanji, _unlockedRadicals, _favorites, notes) => noteCount(notes) >= achievement.count,
  })),
];
