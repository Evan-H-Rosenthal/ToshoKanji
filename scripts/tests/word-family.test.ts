import assert from "node:assert/strict";
import test from "node:test";
import {
  formatWordVariant,
  getWordVariantLabel,
  groupWordsIntoFamilies,
  isCollapsibleWordFamily,
  selectPrimaryWord,
} from "../../src/app/data/wordFamily.ts";
import type { Word } from "../../src/app/types.ts";

function word(id: string, japanese: string, furigana: string, spellingIndex: number, readingIndex: number, tags?: Word["wordTags"]): Word {
  return {
    id,
    japanese,
    furigana,
    romaji: "test",
    meaning: "test meaning",
    wordTags: tags,
    source: { dataset: "JMdict_e", entryId: "123", spellingIndex, readingIndex },
  };
}

test("a normal form wins even when a rare sibling has the same priority", () => {
  const standard = word("w-123-1-1", "境界", "きょうかい", 1, 1);
  const rare = word("w-123-2-1", "疆界", "きょうかい", 2, 1, ["rK"]);
  standard.priorityTags = rare.priorityTags = ["ichi1", "news1", "nf09"];

  assert.equal(selectPrimaryWord([{ word: rare }, { word: standard }])?.word.id, standard.id);
  assert.equal(getWordVariantLabel(rare), "Rare Kanji form");
  assert.equal(formatWordVariant(standard, rare), "疆界");
});

test("search-only Kana and okurigana forms collapse under their normal sibling", () => {
  const normal = word("w-123-1-1", "見通し", "みとおし", 1, 1);
  const searchOnly = word("w-123-2-1", "見通", "みとおし", 2, 1, ["sk"]);

  assert.equal(isCollapsibleWordFamily([normal, searchOnly]), true);
  const families = groupWordsIntoFamilies([searchOnly, normal]);
  assert.equal(families.length, 1);
  assert.equal(families[0].primary.id, normal.id);
  assert.deepEqual(families[0].variants.map((variant) => variant.id), [normal.id, searchOnly.id]);
});

test("a slightly different irregular Kana reading stays paired with its spelling", () => {
  const standard = word("w-123-1-1", "\u901a\u308a", "\u3069\u304a\u308a", 1, 1);
  const irregular = word("w-123-1-2", "\u901a\u308a", "\u3069\u3046\u308a", 1, 2, ["ik"]);

  const families = groupWordsIntoFamilies([irregular, standard]);
  assert.equal(families.length, 1);
  assert.equal(families[0].primary.id, standard.id);
  assert.equal(getWordVariantLabel(irregular), "Irregular Kana usage");
  assert.equal(formatWordVariant(standard, irregular), "\u3069\u3046\u308a");
});

test("ordinary readings in the same JMdict entry collapse without requiring a variant flag", () => {
  const first = word("w-123-1-1", "生花", "いけばな", 1, 1);
  const second = word("w-123-1-2", "生花", "せいか", 1, 2);

  assert.equal(isCollapsibleWordFamily([first, second]), true);
  const families = groupWordsIntoFamilies([first, second]);
  assert.equal(families.length, 1);
  assert.equal(getWordVariantLabel(second, first), "Alternative reading");
});

test("the four-way Oikaze spelling and reading grid becomes one family", () => {
  const variants = [
    word("w-123-1-1", "\u8ffd\u3044\u98a8", "\u304a\u3044\u304b\u305c", 1, 1),
    word("w-123-1-2", "\u8ffd\u3044\u98a8", "\u304a\u3044\u3066", 1, 2),
    word("w-123-2-1", "\u8ffd\u98a8", "\u304a\u3044\u304b\u305c", 2, 1),
    word("w-123-2-2", "\u8ffd\u98a8", "\u304a\u3044\u3066", 2, 2),
  ];

  const families = groupWordsIntoFamilies(variants);
  assert.equal(families.length, 1);
  assert.equal(families[0].primary.id, "w-123-1-1");
  assert.equal(families[0].variants.length, 4);
  assert.deepEqual(families[0].variants.slice(1).map((variant) => getWordVariantLabel(variant, families[0].primary)), ["Alternative reading", "Alternative spelling", "Alternative form"]);
});
