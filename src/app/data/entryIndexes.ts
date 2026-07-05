import { COMPONENTS } from "./generated/components.generated";
import { KANJI } from "./generated/kanji.generated";
import { RADICALS } from "./generated/radicals.generated";
import { KANJI_RARITIES, getKanjiRarity, type KanjiRarity } from "./kanjiRarity";

export const KANJI_BY_ID = new Map(KANJI.map((entry) => [entry.id, entry]));
export const RADICAL_BY_ID = new Map(RADICALS.map((entry) => [entry.id, entry]));
export const RADICAL_INDEX_BY_ID = new Map(RADICALS.map((entry, index) => [entry.id, index]));
export const COMPONENT_BY_ID = new Map(COMPONENTS.map((entry) => [entry.id, entry]));

export const COMPONENT_VARIANTS_BY_CANONICAL_ID = COMPONENTS.reduce((groups, entry) => {
  if (!entry.canonicalComponentId) return groups;
  const variants = groups.get(entry.canonicalComponentId) ?? [];
  variants.push(entry);
  groups.set(entry.canonicalComponentId, variants);
  return groups;
}, new Map<string, typeof COMPONENTS>());

export const KANJI_IDS = KANJI.map((entry) => entry.id);
export const RADICAL_IDS = RADICALS.map((entry) => entry.id);
export const KANJI_IDS_BY_CATEGORY = KANJI.reduce((groups, entry) => {
  const ids = groups.get(entry.learningCategory) ?? [];
  ids.push(entry.id);
  groups.set(entry.learningCategory, ids);
  return groups;
}, new Map<string, string[]>());

export const KANJI_BY_RARITY = KANJI_RARITIES.reduce((groups, rarity) => {
  groups.set(rarity.id, []);
  return groups;
}, new Map<KanjiRarity, typeof KANJI>());

for (const entry of KANJI) {
  KANJI_BY_RARITY.get(getKanjiRarity(entry))?.push(entry);
}
