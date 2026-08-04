from __future__ import annotations

import argparse
import hashlib
import json

from .components import build_component_registry, build_components, build_kanji, build_radicals, parse_kradfile, parse_radkfile
from .config import (
    CATEGORY_FILE, COMPONENTS_OUT_FILE, GENERATED_DIR, KANJI_OUT_FILE, MILESTONE_FILE,
    RADICALS_OUT_FILE, SOURCE_MANIFEST_FILE, WORD_DATA_DIR, WORD_PART_COUNT,
    read_curated_data, unique_values,
)
from .jmdict import parse_jmdict_words
from .kanjidic import parse_kanjidic2, select_curated_kanji
from .sources import ensure_sources, sha256_file
from .word_codec import ENCODING as WORD_ENCODING, encode_word_record


def build_words(kanji_entries: list[dict], words_by_literal: dict[str, list[dict]]) -> list[dict]:
    kanji_by_literal = {entry["char"]: entry["id"] for entry in kanji_entries}
    rank_by_kanji = {
        entry["id"]: {word["id"]: rank for rank, word in enumerate(words_by_literal.get(entry["char"], []))}
        for entry in kanji_entries
    }
    records: dict[str, dict] = {}
    for kanji in kanji_entries:
        for word in words_by_literal.get(kanji["char"], []):
            word_id = word["id"]
            kanji_ids = unique_values([kanji_by_literal[char] for char in word["japanese"] if char in kanji_by_literal])
            if not kanji_ids:
                raise RuntimeError(f"JMdict word {word_id} does not contain its indexed kanji")
            existing = records.get(word_id)
            if existing:
                if existing["word"] != word:
                    raise RuntimeError(f"Conflicting payloads generated for source identity {word_id}")
                existing["kanjiIds"] = unique_values([*existing["kanjiIds"], *kanji_ids])
                continue
            records[word_id] = {"id": word_id, "word": word, "kanjiIds": kanji_ids}

    for record in records.values():
        record["kanjiRanks"] = [rank_by_kanji.get(kanji_id, {}).get(record["id"], 1_000_000) for kanji_id in record["kanjiIds"]]
    return sorted(records.values(), key=lambda record: (
        record["word"]["japanese"], int(record["word"]["source"]["entryId"]),
        record["word"]["source"]["spellingIndex"], record["word"]["source"]["readingIndex"],
    ))


def build_dataset() -> dict:
    literals, categories, default_category = read_curated_data()
    all_entries = parse_kanjidic2()
    selected = select_curated_kanji(all_entries, literals)
    components_by_literal, source_display_forms = parse_kradfile()
    component_registry = build_component_registry(parse_radkfile(source_display_forms), all_entries)
    words_by_literal, jmdict_stats = parse_jmdict_words(set(literals))
    radicals = build_radicals(selected, all_entries, components_by_literal, component_registry)
    kanji = build_kanji(selected, components_by_literal, component_registry)
    components = build_components(kanji, radicals, all_entries)
    words = build_words(kanji, words_by_literal)
    return {
        "kanji": kanji, "radicals": radicals, "components": components, "words": words,
        "categories": categories, "defaultCategory": default_category, "jmdictStats": jmdict_stats,
    }


def json_literal(value, *, compact: bool = False) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":") if compact else None, indent=None if compact else 2)


def chunked(values: list[dict], chunk_count: int) -> list[list[dict]]:
    chunk_size = max(1, (len(values) + chunk_count - 1) // chunk_count)
    return [values[index:index + chunk_size] for index in range(0, len(values), chunk_size)]


def atomic_write(path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(content, encoding="utf-8")
    temporary.replace(path)


def write_dataset(dataset: dict, source_lock: dict) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    kanji_output = f'''import type {{ KanjiEntry }} from "../../types";
import learningCategoryData from "../../../../data/curated/learning-categories.json";

// Generated from pinned KANJIDIC2 and RADKFILE/KRADFILE sources.
// Membership and learning categories are human-owned files under data/curated.

const KANJI_BASE: Omit<KanjiEntry, "learningCategory">[] = {json_literal(dataset["kanji"])};
const categoryByCharacter = learningCategoryData.categories as Record<string, string>;

export const KANJI: KanjiEntry[] = KANJI_BASE.map((entry) => ({{
  ...entry,
  learningCategory: categoryByCharacter[entry.char] ?? learningCategoryData.defaultCategory,
}}));
'''
    radicals_output = f'''import type {{ RadicalEntry }} from "../../types";

// Generated from pinned KANJIDIC2 and source-backed radical-family metadata.
export const RADICALS: RadicalEntry[] = {json_literal(dataset["radicals"])};
'''
    components_output = f'''import type {{ ComponentEntry }} from "../../types";

// Generated from pinned KANJIDIC2 and RADKFILE/KRADFILE lookup metadata.
export const COMPONENTS: ComponentEntry[] = {json_literal(dataset["components"])};
'''

    encoded_words = [encode_word_record(record) for record in dataset["words"]]
    word_chunks = chunked(encoded_words, WORD_PART_COUNT)
    digest = hashlib.sha256(json_literal(encoded_words, compact=True).encode("utf-8")).hexdigest()
    part_names = []
    for index, word_chunk in enumerate(word_chunks, start=1):
        name = f"part-{index}.json"
        part_names.append(name)
        atomic_write(WORD_DATA_DIR / name, json_literal(word_chunk, compact=True))
    for stale in WORD_DATA_DIR.glob("part-*.json"):
        if stale.name not in part_names:
            stale.unlink()
    manifest = {
        "schemaVersion": 3, "encoding": WORD_ENCODING, "version": digest, "count": len(dataset["words"]),
        "parts": [f"/data/words/{name}?v={digest}" for name in part_names],
        "sourceManifest": "/data/source-manifest.json",
    }
    source_manifest = {
        "schemaVersion": 1,
        "sources": source_lock["sources"],
        "curatedInputs": {
            "milestone": {"file": "data/curated/kanji-milestone.json", "sha256": sha256_file(MILESTONE_FILE)},
            "learningCategories": {"file": "data/curated/learning-categories.json", "sha256": sha256_file(CATEGORY_FILE)},
        },
        "counts": {
            "kanji": len(dataset["kanji"]), "radicals": len(dataset["radicals"]),
            "components": len(dataset["components"]), "words": len(dataset["words"]),
        },
        "jmdictProcessing": dataset["jmdictStats"],
    }
    atomic_write(KANJI_OUT_FILE, kanji_output)
    atomic_write(RADICALS_OUT_FILE, radicals_output)
    atomic_write(COMPONENTS_OUT_FILE, components_output)
    atomic_write(WORD_DATA_DIR / "manifest.json", json_literal(manifest, compact=True) + "\n")
    atomic_write(SOURCE_MANIFEST_FILE, json_literal(source_manifest) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build ToshoKanji's source-backed dataset")
    parser.add_argument("--refresh-sources", action="store_true", help="Download current upstream files over HTTPS")
    parser.add_argument("--update-source-lock", action="store_true", help="Record the reviewed cached source hashes")
    parser.add_argument("--check", action="store_true", help="Build in memory without writing generated artifacts")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_lock = ensure_sources(args.refresh_sources, args.update_source_lock)
    dataset = build_dataset()
    if not args.check:
        write_dataset(dataset, source_lock)
    print(
        f"Built {len(dataset['kanji'])} kanji, {len(dataset['radicals'])} radicals, "
        f"{len(dataset['components'])} components, and {len(dataset['words'])} source-distinct words"
    )


if __name__ == "__main__":
    main()
