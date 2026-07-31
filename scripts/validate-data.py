#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIR = ROOT / "src" / "app" / "data" / "generated"
WORD_DATA_DIR = ROOT / "public" / "data" / "words"
REPORT_FILE = ROOT / "reports" / "data-validation.md"

ROMAJI_PLACEHOLDER = "Romaji Placeholder"
ROMAJI_RE = re.compile(r"^[a-zA-Z0-9 '\-.,()/]+$")

VALID_COMPONENT_KINDS = {"canonical-radical", "radical-variant", "visual-component", "raw-fragment"}

PAGE_COMPONENT_KINDS = {"canonical-radical", "radical-variant", "visual-component"}

VALID_LEARNER_PART_ROLES = {"official-radical", "radical-variant", "visual-component"}

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
    manifest = json.loads((WORD_DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    words: list[dict] = []
    for part_url in manifest["parts"]:
        relative_path = part_url.split("?", 1)[0].removeprefix("/")
        words.extend(json.loads((ROOT / "public" / relative_path).read_text(encoding="utf-8")))
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

    component_resolution_by_source: dict[str, tuple] = {}

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
            errors.append(f"{label} embeds word objects; generated kanji must keep vocabulary in dictionary shards")
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
            role = part.get("role")
            if role not in VALID_LEARNER_PART_ROLES:
                errors.append(f"{label} learner part `{part.get('char')}` has invalid role `{role}`")

            component_id = part.get("componentId")
            if not component_id:
                errors.append(f"{label} visible part `{part.get('char')}` has no componentId")
                component_entry = None
            else:
                component_entry = component_by_id.get(component_id)
                if not component_entry:
                    errors.append(f"{label} learner part `{part.get('char')}` references missing component `{component_id}`")

            radical_id = part.get("radicalId")
            if radical_id and radical_id not in radical_id_set:
                errors.append(f"{label} learner part `{part.get('char')}` references missing radical `{radical_id}`")

            if role == "radical-variant" and component_entry and component_entry.get("kind") != "radical-variant":
                errors.append(f"{label} marks `{part.get('char')}` as a radical variant but resolves to `{component_entry.get('kind')}`")
            if part.get("source") == "radk-resolved" and part.get("representation", "direct") == "direct" and part.get("char") == entry.get("char"):
                errors.append(f"{label} displays redundant direct KRAD self-membership `{part.get('char')}`")

            source_char = part.get("sourceChar") or (part.get("char") if part.get("source") == "radk-resolved" else None)
            if source_char:
                resolution = (part.get("char"), component_id, part.get("representation", "direct"), radical_id)
                previous = component_resolution_by_source.get(source_char)
                if previous and previous != resolution:
                    errors.append(f"KRAD source `{source_char}` resolves inconsistently: {previous} versus {resolution}")
                component_resolution_by_source[source_char] = resolution

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
            if part.get("missingRadkMetadata"):
                errors.append(f"{label} raw decomposition part `{part.get('char')}` has no RADKFILE metadata")

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
        if component_kind in {"canonical-radical", "radical-variant"} and not component.get("meanings"):
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
        kanji_ids = word.get("kanjiIds") or []
        kanji_ranks = word.get("kanjiRanks") or []
        if len(kanji_ranks) != len(kanji_ids):
            errors.append(f"{word_id} has {len(kanji_ranks)} kanji ranks for {len(kanji_ids)} kanji IDs")
        elif any(not isinstance(rank, int) or rank < 0 for rank in kanji_ranks):
            errors.append(f"{word_id} has invalid per-kanji learner ranks")
        for kanji_id in kanji_ids:
            kanji_entry = next((entry for entry in kanji if entry["id"] == kanji_id), None)
            if not kanji_entry:
                errors.append(f"{word_id} points to missing kanji `{kanji_id}`")
            elif kanji_entry["char"] not in japanese:
                errors.append(f"{word_id} links to `{kanji_id}` but `{japanese}` does not contain `{kanji_entry['char']}`")

    component_kind_counts = Counter(component.get("kind") for component in components)
    learner_role_counts = Counter(
        part.get("role")
        for entry in kanji
        for part in entry.get("learnerParts") or []
    )
    hidden_self_count = sum(len((entry.get("rawDecomposition") or {}).get("hiddenSelfParts") or []) for entry in kanji)
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    report = [
        "# Data Validation Report",
        "",
        f"- Kanji entries: {len(kanji)}",
        f"- Radical entries: {len(radicals)}",
        f"- Component entries: {len(components)}",
        f"- Word entries: {len(words)}",
        f"- Canonical radical components: {component_kind_counts['canonical-radical']}",
        f"- Radical variant components: {component_kind_counts['radical-variant']}",
        f"- Visual lookup components: {component_kind_counts['visual-component']}",
        f"- Visible parts without component IDs: {sum(1 for entry in kanji for part in entry.get('learnerParts') or [] if not part.get('componentId'))}",
        f"- Direct self-memberships hidden from learner display: {hidden_self_count}",
        f"- Learner-facing part roles: {dict(sorted(learner_role_counts.items()))}",
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
