import test from "node:test";
import assert from "node:assert/strict";
import { romanizeKana } from "../romanize-kana.mjs";

test("romanizes standard kana with Hepburn output", () => {
  assert.equal(romanizeKana("\u3057\u3093\u3076\u3093"), "shinbun");
  assert.equal(romanizeKana("\u304c\u3063\u3053\u3046"), "gakkou");
});

test("preserves the consonant in extended katakana combinations", () => {
  assert.equal(romanizeKana("\u30a6\u30a3\u30ad\u30e1\u30c7\u30a3\u30a2"), "wikimedeia");
  assert.equal(romanizeKana("\u30a6\u30a7\u30d6"), "webu");
  assert.equal(romanizeKana("\u30a6\u30a9\u30fc\u30eb"), "wooru");
});

test("normalizes half-width katakana before romanizing", () => {
  assert.equal(romanizeKana("\uff80\uff8b\u306c"), "tahinu");
});
