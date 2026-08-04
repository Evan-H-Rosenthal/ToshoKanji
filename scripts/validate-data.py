#!/usr/bin/env python3
"""Validate generated artifacts against pinned upstream sources and curated inputs."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.data_pipeline.build import build_dataset
from scripts.data_pipeline.config import (
    CATEGORY_FILE,
    COMPONENTS_OUT_FILE,
    KANJI_OUT_FILE,
    MILESTONE_FILE,
    RADICALS_OUT_FILE,
    SOURCE_MANIFEST_FILE,
    WORD_DATA_DIR,
    read_curated_data,
)
from scripts.data_pipeline.kanjidic import parse_kanjidic2
from scripts.data_pipeline.sources import ensure_sources, sha256_file
from scripts.data_pipeline.word_codec import ENCODING as WORD_ENCODING, decode_word_record

REPORT_FILE = ROOT / "reports" / "data-validation.md"
WORD_ID_RE = re.compile(r"^w-[0-9]+-[0-9]+-[0-9]+$")
ROMAJI_RE = re.compile(r"^[A-Za-z0-9 '\-.,()/]+$")


def read_json_assignment(path: Path, marker: str):
    text = path.read_text(encoding="utf-8")
    index = text.find(marker)
    if index < 0:
        raise ValueError(f"Could not find {marker!r} in {path}")
    equals = text.find("=", index + len(marker))
    decoder = json.JSONDecoder()
    value, _ = decoder.raw_decode(text[equals + 1:].lstrip())
    return value


def read_generated_words() -> tuple[dict, list[list], list[dict]]:
    manifest = json.loads((WORD_DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    encoded: list[list] = []
    for part_url in manifest["parts"]:
        relative = part_url.split("?", 1)[0].removeprefix("/")
        encoded.extend(json.loads((ROOT / "public" / relative).read_text(encoding="utf-8")))
    return manifest, encoded, [decode_word_record(record) for record in encoded]


def fingerprint(value) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def duplicates(values: list[str]) -> list[str]:
    return sorted(value for value, count in Counter(values).items() if count > 1)


def main() -> int:
    errors: list[str] = []
    source_lock = ensure_sources(refresh=False, update_lock=False)
    expected = build_dataset()
    actual = {
        "kanji": read_json_assignment(KANJI_OUT_FILE, "const KANJI_BASE"),
        "radicals": read_json_assignment(RADICALS_OUT_FILE, "export const RADICALS"),
        "components": read_json_assignment(COMPONENTS_OUT_FILE, "export const COMPONENTS"),
    }
    word_manifest, encoded_words, actual_words = read_generated_words()
    actual["words"] = actual_words

    for name in ("kanji", "radicals", "components", "words"):
        if actual[name] != expected[name]:
            errors.append(
                f"Generated {name} differ from the pinned-source build "
                f"(expected {fingerprint(expected[name])[:16]}, found {fingerprint(actual[name])[:16]})"
            )

    literals, categories, _ = read_curated_data()
    if [entry["char"] for entry in actual["kanji"]] != literals:
        errors.append("Generated Kanji order/membership differs from the curated milestone")
    if set(categories) != set(literals):
        errors.append("Learning-category coverage differs from milestone membership")

    source_manifest = json.loads(SOURCE_MANIFEST_FILE.read_text(encoding="utf-8"))
    expected_counts = {name: len(actual[name]) for name in ("kanji", "radicals", "components", "words")}
    if source_manifest.get("counts") != expected_counts:
        errors.append("Published source-manifest counts do not match generated artifacts")
    curated_manifest = source_manifest.get("curatedInputs", {})
    if curated_manifest.get("milestone", {}).get("sha256") != sha256_file(MILESTONE_FILE):
        errors.append("Published milestone hash is stale")
    if curated_manifest.get("learningCategories", {}).get("sha256") != sha256_file(CATEGORY_FILE):
        errors.append("Published learning-category hash is stale")
    if source_manifest.get("sources") != source_lock.get("sources"):
        errors.append("Published upstream source metadata differs from data/source-lock.json")
    if word_manifest.get("count") != len(actual_words):
        errors.append("Word manifest count does not match its shards")
    if word_manifest.get("schemaVersion") != 3 or word_manifest.get("encoding") != WORD_ENCODING:
        errors.append("Word manifest does not declare the supported compact encoding")
    word_payload = json.dumps(encoded_words, ensure_ascii=False, separators=(",", ":"))
    word_payload_hash = hashlib.sha256(word_payload.encode("utf-8")).hexdigest()
    if word_manifest.get("version") != word_payload_hash:
        errors.append("Word manifest version is not the full payload SHA-256")
    if any(f"?v={word_payload_hash}" not in part for part in word_manifest.get("parts", [])):
        errors.append("Word shard URLs do not carry the full payload hash")

    ids_by_kind = {
        "Kanji": [entry["id"] for entry in actual["kanji"]],
        "radical": [entry["id"] for entry in actual["radicals"]],
        "component": [entry["id"] for entry in actual["components"]],
        "word": [entry["id"] for entry in actual_words],
    }
    for kind, ids in ids_by_kind.items():
        for value in duplicates(ids):
            errors.append(f"Duplicate {kind} id: {value}")

    kanji_by_id = {entry["id"]: entry for entry in actual["kanji"]}
    radical_ids = set(ids_by_kind["radical"])
    component_ids = set(ids_by_kind["component"])
    component_by_id = {entry["id"]: entry for entry in actual["components"]}
    kanjidic_entries = parse_kanjidic2()
    hidden_self_count = 0
    evidenced_self_radical_count = 0
    unavailable_romanization_count = 0
    bare_canonical_usage_count = 0

    for component in actual["components"]:
        display_entry = kanjidic_entries.get(component["char"])
        expected_character_metadata = {}
        if display_entry:
            expected_character_metadata = {
                "characterMeanings": display_entry.get("meanings", []),
                "characterOnyomi": display_entry.get("onyomi", []),
                "characterKunyomi": display_entry.get("kunyomi", []),
            }
            if display_entry.get("grade") is not None:
                expected_character_metadata["characterGrade"] = display_entry["grade"]
        for key in ("characterMeanings", "characterOnyomi", "characterKunyomi", "characterGrade"):
            if (key in component) != (key in expected_character_metadata) or component.get(key) != expected_character_metadata.get(key):
                errors.append(f"{component['id']} has {key} inconsistent with its displayed KANJIDIC2 character")

        source_char = component.get("sourceChar")
        if source_char and source_char != component["char"]:
            source_entry = kanjidic_entries.get(source_char)
            expected_source_character = None
            if source_entry:
                expected_source_character = {
                    "char": source_char,
                    "meanings": source_entry.get("meanings", []),
                    "onyomi": source_entry.get("onyomi", []),
                    "kunyomi": source_entry.get("kunyomi", []),
                }
                if source_entry.get("grade") is not None:
                    expected_source_character["grade"] = source_entry["grade"]
            if component.get("sourceCharacter") != expected_source_character:
                errors.append(f"{component['id']} conflates or omits its distinct RADKFILE source-label character")

    for entry in actual["kanji"]:
        official = entry.get("officialRadical", {})
        if official.get("id") not in radical_ids:
            errors.append(f"{entry['id']} references a missing official radical")
        if entry.get("char") == official.get("char"):
            bare_canonical_usage_count += 1
            canonical_component = component_by_id.get(f"c-{official.get('id')}")
            if not canonical_component or entry["id"] not in canonical_component.get("kanjiIds", []):
                errors.append(f"{entry['id']} is missing from its exact canonical radical component page")
        parts = entry.get("learnerParts", [])
        official_parts = [part for part in parts if part.get("role") == "official-radical"]
        if official.get("positionedFormKnown"):
            if not official.get("form"):
                errors.append(f"{entry['id']} has a source-established radical form without a form value")
            if not any(part.get("char") == official.get("form") for part in official_parts):
                errors.append(f"{entry['id']} does not expose its source-established radical form among visible shapes")
        else:
            if "form" in official:
                errors.append(f"{entry['id']} stores a synthetic visible radical form without source evidence")
            if official_parts:
                errors.append(f"{entry['id']} exposes a synthetic official radical among visible shapes")
        for part in parts:
            if part.get("componentId") not in component_ids:
                errors.append(f"{entry['id']} references missing component {part.get('componentId')}")
            if part.get("role") == "official-radical":
                if part.get("positionedFormKnown") is not True or "KRADFILE/RADKFILE" not in part.get("source", ""):
                    errors.append(f"{entry['id']} claims a positioned radical without source evidence")
                if part.get("representation") == "direct" and part.get("char") == entry.get("char"):
                    if "KANJIDIC2 rad_name" not in part.get("source", ""):
                        errors.append(f"{entry['id']} exposes a self-form radical without independent KANJIDIC2 name evidence")
                    else:
                        evidenced_self_radical_count += 1
            elif part.get("representation") == "direct" and part.get("char") == entry.get("char"):
                errors.append(f"{entry['id']} exposes a direct self-membership as a non-radical lookup shape")
        raw = entry.get("rawDecomposition", {})
        if raw.get("confidence") != "source-backed":
            errors.append(f"{entry['id']} decomposition is not marked source-backed")
        if raw.get("interpretation") != "visual lookup elements; not semantic or etymological claims":
            errors.append(f"{entry['id']} decomposition lacks the non-semantic source policy")
        hidden_self_count += len(raw.get("hiddenSelfParts", []))
        visible_lookup_chars = {
            part.get("sourceChar", part.get("char"))
            for part in parts
            if part.get("role") != "official-radical"
        }
        if any(char in visible_lookup_chars for char in raw.get("hiddenSelfParts", [])):
            errors.append(f"{entry['id']} exposes a direct self-membership as a lookup component")

    selected_chars = set(literals)
    for record in actual_words:
        word = record.get("word", {})
        source = word.get("source", {})
        if not WORD_ID_RE.fullmatch(record.get("id", "")):
            errors.append(f"Word has invalid source identity: {record.get('id')}")
        expected_id = f"w-{source.get('entryId')}-{source.get('spellingIndex')}-{source.get('readingIndex')}"
        if record.get("id") != expected_id:
            errors.append(f"Word id/source mismatch: {record.get('id')}")
        spelling = word.get("japanese", "")
        expected_kanji_ids = []
        seen = set()
        for char in spelling:
            kanji_id = f"k-{char}"
            if char in selected_chars and kanji_id not in seen:
                expected_kanji_ids.append(kanji_id)
                seen.add(kanji_id)
        if record.get("kanjiIds") != expected_kanji_ids:
            errors.append(f"{record.get('id')} has Kanji links inconsistent with spelling order")
        if not word.get("senses") or any(not sense.get("glosses") for sense in word.get("senses", [])):
            errors.append(f"{record.get('id')} has a missing/empty applicable sense")
        romaji = word.get("romaji", "")
        if word.get("romanizationStatus") == "unavailable":
            unavailable_romanization_count += 1
            if romaji:
                errors.append(f"{record.get('id')} marks non-empty romanization unavailable")
        elif not romaji or not ROMAJI_RE.fullmatch(romaji):
            errors.append(f"{record.get('id')} has invalid romanization")
        if len(record.get("kanjiRanks", [])) != len(record.get("kanjiIds", [])):
            errors.append(f"{record.get('id')} has inconsistent per-Kanji ranks")
        for kanji_id in record.get("kanjiIds", []):
            if kanji_id not in kanji_by_id:
                errors.append(f"{record.get('id')} references missing {kanji_id}")

    component_kind_counts = Counter(entry.get("kind") for entry in actual["components"])
    report = [
        "# Data Validation Report", "",
        f"- Result: {'PASS' if not errors else 'FAIL'}",
        f"- Kanji: {len(actual['kanji'])}",
        f"- Radicals represented: {len(actual['radicals'])}",
        f"- Lookup component pages: {len(actual['components'])}",
        f"- Source-distinct JMdict spelling/reading records: {len(actual_words)}",
        f"- Direct self-memberships hidden: {hidden_self_count}",
        f"- Source-evidenced self-form radicals shown: {evidenced_self_radical_count}",
        f"- Bare canonical-radical usages exposed on component pages: {bare_canonical_usage_count}",
        f"- Romanizations explicitly unavailable: {unavailable_romanization_count}",
        f"- Canonical radical components: {component_kind_counts['canonical-radical']}",
        f"- Radical variants: {component_kind_counts['radical-variant']}",
        f"- Other visual lookup components: {component_kind_counts['visual-component']}",
        "", "## Validation basis", "",
        "Generated artifacts are rebuilt in memory from the exact cached files pinned by `data/source-lock.json` and compared in full. Membership and category coverage are checked against the human-authored curated files. Word identity, spelling-order links, sense preservation, romanization status, radical evidence, component references, displayed-character metadata, distinct source-label metadata, and the non-semantic lookup-shape policy are then checked across the complete dataset.",
        "", "## Errors", "",
        *(f"- {error}" for error in errors[:200]),
    ]
    if not errors:
        report.append("- None")
    elif len(errors) > 200:
        report.append(f"- ...and {len(errors) - 200} more")
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    REPORT_FILE.write_text("\n".join(report) + "\n", encoding="utf-8")

    print(f"Validated {len(actual['kanji'])} Kanji and {len(actual_words)} word records: {'PASS' if not errors else 'FAIL'}")
    if errors:
        for error in errors[:20]:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
