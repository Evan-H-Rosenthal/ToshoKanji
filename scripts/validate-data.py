#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIR = ROOT / "src" / "app" / "data" / "generated"
REPORT_FILE = ROOT / "reports" / "data-validation.md"

ROMAJI_PLACEHOLDER = "Romaji Placeholder"
ROMAJI_RE = re.compile(r"^[a-zA-Z0-9 '\-.,()/]+$")

FORBIDDEN_VISIBLE_COMPONENTS = {
    "\u4e36",
    "\u30ce",
    "\u4e3f",
    "\u4e28",
    "\uff5c",
    "\u4e85",
    "\u4e40",
    "\u4e41",
    "\u30cf",
    "\u4e2a",
    "\u5e76",
    "\u4e5e",
}

VISIBLE_COMPONENT_ALLOWLIST: set[str] = set()

VALID_COMPONENT_KINDS = {
    "canonical-radical",
    "radical-variant",
    "learner-component",
    "raw-fragment",
}

PAGE_COMPONENT_KINDS = {
    "canonical-radical",
    "radical-variant",
    "learner-component",
}

VALID_LEARNER_PART_ROLES = {
    "official-radical",
    "semantic",
    "phonetic",
    "learner-component",
}

VALID_RAW_PART_ROLES = {
    "raw-fragment",
    "source-component",
    "source-radical",
}


def read_exported_json(path: Path, export_name: str):
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"export const {export_name}\b[^=]*=", text)
    if not match:
        raise ValueError(f"Could not find export {export_name} in {path}")

    decoder = json.JSONDecoder()
    value, _ = decoder.raw_decode(text[match.end() :].lstrip())
    return value


def read_generated_words() -> list[dict]:
    word_part_paths = sorted(
        GENERATED_DIR.glob("words.part-*.generated.ts"),
        key=lambda path: int(re.search(r"part-(\d+)", path.name).group(1)),
    )
    if not word_part_paths:
        return read_exported_json(GENERATED_DIR / "words.generated.ts", "WORDS")

    words: list[dict] = []
    for index, path in enumerate(word_part_paths, start=1):
        words.extend(read_exported_json(path, f"WORDS_PART_{index}"))
    return words


def duplicate_values(values: list[str]) -> list[str]:
    return sorted(value for value, count in Counter(values).items() if count > 1)


def bullet_list(values: list[str], empty_text: str = "None") -> str:
    if not values:
        return f"- {empty_text}\n"
    return "".join(f"- {value}\n" for value in values)


def main() -> int:
    kanji = read_exported_json(GENERATED_DIR / "kanji.generated.ts", "KANJI")
    radicals = read_exported_json(GENERATED_DIR / "radicals.generated.ts", "RADICALS")
    components = read_exported_json(GENERATED_DIR / "components.generated.ts", "COMPONENTS")
    words = read_generated_words()

    errors: list[str] = []
    warnings: list[str] = []
    suspicious_decompositions: list[str] = []
    filtered_examples: list[str] = []
    suspicious_word_ids: list[str] = []

    kanji_ids = [entry["id"] for entry in kanji]
    radical_ids = [entry["id"] for entry in radicals]
    component_ids = [entry["id"] for entry in components]
    word_ids = [entry["id"] for entry in words]
    kanji_id_set = set(kanji_ids)
    radical_id_set = set(radical_ids)
    component_id_set = set(component_ids)
    word_id_set = set(word_ids)
    component_by_id = {entry["id"]: entry for entry in components}

    for duplicate in duplicate_values(kanji_ids):
        errors.append(f"Duplicate kanji id `{duplicate}`")
    for duplicate in duplicate_values(radical_ids):
        errors.append(f"Duplicate radical id `{duplicate}`")
    for duplicate in duplicate_values(component_ids):
        errors.append(f"Duplicate component id `{duplicate}`")
    for duplicate in duplicate_values(word_ids):
        errors.append(f"Duplicate word id `{duplicate}`")

    for entry in kanji:
        label = f"{entry['id']} ({entry['char']})"
        official_radical = entry.get("officialRadical")
        learner_parts = entry.get("learnerParts") or []
        raw_decomposition = entry.get("rawDecomposition") or {}
        raw_parts = raw_decomposition.get("parts") or []
        raw_components = entry.get("rawComponents") or []
        provenance = entry.get("componentProvenance") or {}
        filtered_components = raw_decomposition.get("filteredParts") or provenance.get("filteredComponents") or []

        if "words" in entry:
            errors.append(f"{label} embeds word objects; generated kanji should reference words by `wordIds`")
        if "learnerParts" not in entry:
            errors.append(f"{label} is missing learnerParts")
        if "rawDecomposition" not in entry:
            errors.append(f"{label} is missing rawDecomposition")

        if not official_radical:
            errors.append(f"{label} has no official radical")
        elif official_radical.get("id") not in radical_id_set:
            errors.append(f"{label} references missing official radical `{official_radical.get('id')}`")

        if not learner_parts:
            warnings.append(f"{label} has empty visible components")

        for radical_id in entry.get("radicalIds") or []:
            if radical_id not in radical_id_set:
                errors.append(f"{label} references missing radical `{radical_id}`")

        for component_id in entry.get("componentIds") or []:
            if component_id not in component_id_set:
                errors.append(f"{label} references missing component `{component_id}`")

        for part in learner_parts:
            if part.get("role") not in VALID_LEARNER_PART_ROLES:
                errors.append(f"{label} learner part `{part.get('char')}` has invalid role `{part.get('role')}`")
            component_id = part.get("componentId")
            if component_id and component_id not in component_id_set:
                errors.append(f"{label} learner part `{part.get('char')}` references missing component `{component_id}`")
            radical_id = part.get("radicalId")
            if radical_id and radical_id not in radical_id_set:
                errors.append(f"{label} learner part `{part.get('char')}` references missing radical `{radical_id}`")

        for part in raw_parts:
            if part.get("role") not in VALID_RAW_PART_ROLES:
                errors.append(f"{label} raw decomposition part `{part.get('char')}` has invalid role `{part.get('role')}`")
            if part.get("debugOnly") is not True:
                errors.append(f"{label} raw decomposition part `{part.get('char')}` is not marked debugOnly")
            component_id = part.get("componentId")
            if component_id and component_id not in component_id_set:
                errors.append(f"{label} raw decomposition part `{part.get('char')}` references missing component `{component_id}`")
            radical_id = part.get("radicalId")
            if radical_id and radical_id not in radical_id_set:
                errors.append(f"{label} raw decomposition part `{part.get('char')}` references missing radical `{radical_id}`")

        for part in learner_parts:
            component = part.get("char")
            component_entry = component_by_id.get(part.get("componentId"))
            official_form = official_radical.get("form") if official_radical else None
            if component in FORBIDDEN_VISIBLE_COMPONENTS and component != official_form and component not in VISIBLE_COMPONENT_ALLOWLIST:
                errors.append(f"{label} learnerParts displays forbidden raw stroke fragment `{component}`")
            if part.get("role") == "raw-fragment":
                errors.append(f"{label} learnerParts includes raw-fragment role for `{component}`")
            if component_entry and component_entry.get("kind") == "raw-fragment":
                errors.append(f"{label} learnerParts references raw-fragment component `{component_entry['id']}`")
            if component_entry and not component_entry.get("meanings"):
                warnings.append(
                    f"{label} displays component `{component_entry['id']}` ({component_entry['char']}) with no meanings"
                )

        for word_id in entry.get("wordIds") or []:
            if word_id not in word_id_set:
                errors.append(f"{label} references missing word `{word_id}`")

        if filtered_components:
            filtered_examples.append(f"{label}: filtered {', '.join(f'`{component}`' for component in filtered_components)}")

        if len(raw_parts or raw_components) > len(learner_parts):
            suspicious_decompositions.append(
                f"{label}: raw {len(raw_parts or raw_components)} components, visible {len(learner_parts)} components"
            )

    for radical in radicals:
        component_id = radical.get("componentId")
        if not component_id:
            errors.append(f"{radical['id']} ({radical['char']}) has no componentId")
        elif component_id not in component_id_set:
            errors.append(f"{radical['id']} ({radical['char']}) points to missing component `{component_id}`")
        for kanji_id in radical.get("kanjiIds") or []:
            if kanji_id not in kanji_id_set:
                errors.append(f"{radical['id']} ({radical['char']}) points to missing kanji `{kanji_id}`")

    for component in components:
        component_id = component["id"]
        radical_id = component.get("radicalId")
        component_kind = component.get("kind")
        if component_kind not in VALID_COMPONENT_KINDS:
            errors.append(f"{component_id} has invalid component kind `{component_kind}`")
        if component_kind not in PAGE_COMPONENT_KINDS:
            errors.append(f"{component_id} is a `{component_kind}` but generated components are learner-facing pages")
        if component_kind == "canonical-radical" and not radical_id:
            errors.append(f"{component_id} is a canonical radical component with no radicalId")
        if component_kind == "radical-variant":
            canonical_component_id = component.get("canonicalComponentId")
            if not canonical_component_id:
                errors.append(f"{component_id} is a radical variant with no canonicalComponentId")
            elif canonical_component_id not in component_id_set:
                errors.append(f"{component_id} points to missing canonical component `{canonical_component_id}`")
            if not radical_id:
                errors.append(f"{component_id} is a radical variant with no radicalId")
        if component_kind in {"canonical-radical", "radical-variant", "learner-component"} and not component.get("meanings"):
            warnings.append(f"{component_id} ({component.get('char')}) has no meanings")
        if radical_id and radical_id not in radical_id_set:
            errors.append(f"{component_id} points to missing radical `{radical_id}`")
        for kanji_id in component.get("kanjiIds") or []:
            if kanji_id not in kanji_id_set:
                errors.append(f"{component_id} points to missing kanji `{kanji_id}`")

    for word in words:
        word_id = word["id"]
        word_payload = word.get("word", {})
        japanese = word_payload.get("japanese", "")
        romaji = word_payload.get("romaji", "")
        if not romaji or romaji == ROMAJI_PLACEHOLDER:
            errors.append(f"{word_id} is missing generated romaji")
        elif not ROMAJI_RE.match(romaji):
            errors.append(f"{word_id} has invalid romaji `{romaji}`")
        if not word_id.startswith("w-") or any(ch.isspace() for ch in word_id):
            suspicious_word_ids.append(f"`{word_id}`")
        for kanji_id in word.get("kanjiIds") or []:
            kanji_entry = next((entry for entry in kanji if entry["id"] == kanji_id), None)
            if not kanji_entry:
                errors.append(f"{word_id} points to missing kanji `{kanji_id}`")
            elif kanji_entry["char"] not in japanese:
                errors.append(f"{word_id} links to `{kanji_id}` but `{japanese}` does not contain `{kanji_entry['char']}`")

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    report = [
        "# Data Validation Report",
        "",
        f"- Kanji entries: {len(kanji)}",
        f"- Radical entries: {len(radicals)}",
        f"- Component entries: {len(components)}",
        f"- Word entries: {len(words)}",
        f"- Hard errors: {len(errors)}",
        f"- Warnings: {len(warnings)}",
        "",
        "## Broken References",
        bullet_list(errors),
        "## Kanji With Empty Visible Components",
        bullet_list(warnings),
        "## Suspicious Decompositions",
        bullet_list(suspicious_decompositions),
        "## Words With Suspicious IDs",
        bullet_list(suspicious_word_ids),
        "## Raw Components Filtered From Learner Display",
        bullet_list(filtered_examples),
    ]
    REPORT_FILE.write_text("\n".join(report), encoding="utf-8")

    print(f"Wrote validation report to {REPORT_FILE.relative_to(ROOT)}")
    if errors:
        print(f"Validation failed with {len(errors)} hard error(s).")
        return 1
    print("Validation passed with no hard errors.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
