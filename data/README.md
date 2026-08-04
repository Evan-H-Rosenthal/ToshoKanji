# Data ownership and source policy

ToshoKanji keeps human curriculum decisions separate from dictionary facts.

## Human-owned inputs

- `curated/kanji-milestone.json` is the explicit membership list. The generator never assumes that the first N KANJIDIC2 records are Joyo Kanji.
- `curated/learning-categories.json` contains the author's hand-assigned categories. It must cover the milestone exactly. In the Vite development app, category changes are written atomically to this file and appear through hot reload.

To expand the dataset, add reviewed characters to the milestone and assign each one a category. No parser or UI rule needs to be changed merely because the milestone grows.

## Upstream facts

`source-lock.json` pins the HTTPS URL, complete SHA-256 digest, byte size, and available source date/version for KANJIDIC2, JMdict_e, KRADFILE, and RADKFILE. Ordinary generation refuses a changed cache. `npm run data:refresh` is the explicit review boundary for accepting newer upstream files.

- KANJIDIC2 supplies standalone-character readings, meanings, grades, frequency metadata, and the classical radical number.
- JMdict_e supplies source entry identities, spellings, readings, restrictions, priority tags, information tags, and applicable English senses.
- KRADFILE supplies visual lookup memberships. RADKFILE supplies display metadata for those lookup labels.

## Component interpretation policy

Lookup membership is not treated as etymology or meaning. ToshoKanji shows every renderable source lookup shape, hides direct self-memberships and source image labels for which no reviewed text form exists, and records those omissions in raw provenance. A direct self-form is retained only when KANJIDIC2 independently names that character as a form of the same classical radical family. The canonical radical is always stored as dictionary classification metadata. A visible radical form is stored among learner-facing shapes only when KRADFILE/RADKFILE plus radical-family metadata establish it; otherwise no visible form is synthesized.

A lookup shape's own KANJIDIC2 entry, when one exists, is presented separately as standalone-character information and receives the Kanji-page color for an explorable character. Those meanings and readings are never asserted to be the shape's role inside another Kanji. Legacy RADKFILE image labels are rendered only through the source-character-to-Unicode mapping published in KRADFILE's own header. Radical-family matching for those forms is derived from Unicode radical names or KANJIDIC2 `rad_name` evidence for the same classical family, never from one example Kanji or a preferred-form table. The pinned sources do not encode whether a component is phonetic, semantic, or pictorial, so ToshoKanji does not assign those roles.

Learner-facing component names use the first standalone KANJIDIC2 meaning of the displayed character (or its canonical radical family), with later meanings shown beneath the title on the component page. A source label and its displayed shape remain separate records: when RADKFILE labels a rendered shape with another character, that label character's KANJIDIC2 information may be shown in a clearly separate source-label section but is never used as the displayed shape's name or meaning.

When a milestone Kanji is exactly the canonical character for its KANJIDIC2 radical family, its component page includes that Kanji as a bare usage. This relationship does not reintroduce the character as a visible component of itself on its Kanji page; direct self-memberships remain hidden from learner decomposition.

## Verification

`npm run data:validate` rebuilds the complete dataset in memory from the pinned sources and compares every generated Kanji, radical, component, and decoded word record. It also checks curated coverage, source manifests and hashes, source-derived word identities, spelling-order links, senses, romanization status, component references, self-membership filtering, and positioned-radical evidence.
