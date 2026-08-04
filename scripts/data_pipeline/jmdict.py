from __future__ import annotations

import gzip
import json
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter

from .config import JMDICT_E_GZ, ROMANIZER_FILE, WORD_METADATA_TAG_ALIASES, WORD_METADATA_TAGS, unique_values

XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"
LEVEL_ONE_PRIORITIES = {"news1", "ichi1", "spec1", "gai1"}
LEVEL_TWO_PRIORITIES = {"news2", "ichi2", "spec2", "gai2"}


def text_values(element: ET.Element, path: str) -> list[str]:
    return [node.text for node in element.findall(path) if node.text]


def normalize_metadata_tag(value: str | None) -> str | None:
    if not value:
        return None
    if value in WORD_METADATA_TAGS:
        return value
    return WORD_METADATA_TAG_ALIASES.get(value)


def priority_key(tags: list[str]) -> tuple[int, int]:
    if any(tag in LEVEL_ONE_PRIORITIES for tag in tags):
        bucket = 0
    elif any(tag in LEVEL_TWO_PRIORITIES for tag in tags):
        bucket = 1
    elif any(tag.startswith("nf") for tag in tags):
        bucket = 2
    else:
        bucket = 3
    nf_values = [int(tag[2:]) for tag in tags if tag.startswith("nf") and tag[2:].isdigit()]
    return bucket, min(nf_values, default=999)


def applicable_senses(entry: ET.Element, japanese: str, reading: str, stats: Counter) -> list[dict]:
    senses: list[dict] = []
    for sense_index, sense in enumerate(entry.findall("sense"), start=1):
        spelling_restrictions = text_values(sense, "stagk")
        reading_restrictions = text_values(sense, "stagr")
        if spelling_restrictions and japanese not in spelling_restrictions:
            stats["restrictedSensesSkipped"] += 1
            continue
        if reading_restrictions and reading not in reading_restrictions:
            stats["restrictedSensesSkipped"] += 1
            continue
        glosses = [
            gloss.text
            for gloss in sense.findall("gloss")
            if gloss.text and gloss.attrib.get(XML_LANG, "eng") == "eng"
        ]
        if not glosses:
            continue
        sense_record = {"index": sense_index, "glosses": glosses}
        for path, key in (
            ("pos", "partsOfSpeech"),
            ("field", "fields"),
            ("misc", "usageLabels"),
            ("dial", "dialects"),
            ("s_inf", "notes"),
        ):
            values = text_values(sense, path)
            if values:
                sense_record[key] = values
        senses.append(sense_record)
    return senses


def romanize_words(records: dict[str, dict]) -> None:
    readings = unique_values([record["furigana"] for record in records.values()])
    if not readings:
        return
    result = subprocess.run(
        ["node", str(ROMANIZER_FILE)],
        input=json.dumps(readings, ensure_ascii=False),
        text=True,
        encoding="utf-8",
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"WanaKana romanization failed: {result.stderr.strip()}")
    romanized = json.loads(result.stdout)
    if len(romanized) != len(readings):
        raise RuntimeError("WanaKana returned an unexpected number of readings")
    by_reading = dict(zip(readings, romanized))
    for record in records.values():
        value = by_reading[record["furigana"]]
        if value.isascii():
            record["romaji"] = value
        else:
            record["romaji"] = ""
            record["romanizationStatus"] = "unavailable"


def word_sort_key(word: dict) -> tuple:
    bucket, nf_rank = priority_key(word.get("priorityTags", []))
    source = word["source"]
    return (
        bucket,
        nf_rank,
        int(source["entryId"]),
        source["spellingIndex"],
        source["readingIndex"],
    )


def parse_jmdict_words(target_literals: set[str]) -> tuple[dict[str, list[dict]], dict]:
    memberships: dict[str, list[str]] = {literal: [] for literal in target_literals}
    records: dict[str, dict] = {}
    stats: Counter = Counter()

    with gzip.open(JMDICT_E_GZ, "rb") as source:
        for _, entry in ET.iterparse(source, events=("end",)):
            if entry.tag != "entry":
                continue
            stats["entriesScanned"] += 1
            spelling_elements = entry.findall("k_ele")
            spellings = [element.findtext("keb") for element in spelling_elements]
            entry_literals = target_literals.intersection("".join(value for value in spellings if value))
            if not entry_literals:
                entry.clear()
                continue
            stats["entriesMatched"] += 1
            entry_id = entry.findtext("ent_seq")
            if not entry_id:
                entry.clear()
                continue

            reading_elements = entry.findall("r_ele")
            for spelling_index, spelling_element in enumerate(spelling_elements, start=1):
                japanese = spelling_element.findtext("keb")
                if not japanese:
                    continue
                matched_literals = target_literals.intersection(japanese)
                if not matched_literals:
                    continue
                spelling_info = text_values(spelling_element, "ke_inf")
                spelling_priorities = text_values(spelling_element, "ke_pri")

                for reading_index, reading_element in enumerate(reading_elements, start=1):
                    reading = reading_element.findtext("reb")
                    if not reading:
                        continue
                    if reading_element.find("re_nokanji") is not None:
                        stats["excludedNoKanjiReadings"] += 1
                        continue
                    restrictions = text_values(reading_element, "re_restr")
                    if restrictions and japanese not in restrictions:
                        stats["restrictedReadingsSkipped"] += 1
                        continue
                    if restrictions:
                        stats["restrictedReadingsApplied"] += 1
                    senses = applicable_senses(entry, japanese, reading, stats)
                    if not senses:
                        stats["pairsWithoutApplicableEnglishSense"] += 1
                        continue

                    reading_info = text_values(reading_element, "re_inf")
                    priorities = unique_values([
                        *spelling_priorities,
                        *text_values(reading_element, "re_pri"),
                    ])
                    information = unique_values([*spelling_info, *reading_info])
                    word_tags = unique_values([
                        normalize_metadata_tag(value)
                        for value in information
                    ])
                    usage_labels = unique_values([
                        label
                        for sense in senses
                        for label in sense.get("usageLabels", [])
                    ])
                    word_id = f"w-{entry_id}-{spelling_index}-{reading_index}"
                    record = {
                        "id": word_id,
                        "japanese": japanese,
                        "furigana": reading,
                        "romaji": "",
                        "meaning": "; ".join(senses[0]["glosses"]),
                        "common": bool(priorities),
                        "senses": senses,
                        "source": {
                            "dataset": "JMdict_e",
                            "entryId": entry_id,
                            "spellingIndex": spelling_index,
                            "readingIndex": reading_index,
                        },
                    }
                    if priorities:
                        record["priorityTags"] = priorities
                    if information:
                        record["information"] = information
                    if word_tags:
                        record["wordTags"] = word_tags
                    if usage_labels:
                        record["usageLabels"] = usage_labels
                    records[word_id] = record
                    for literal in matched_literals:
                        memberships[literal].append(word_id)
                    stats["pairsGenerated"] += 1
            entry.clear()

    romanize_words(records)
    words_by_literal = {
        literal: sorted((records[word_id] for word_id in word_ids), key=word_sort_key)
        for literal, word_ids in memberships.items()
    }
    stats["uniqueRecords"] = len(records)
    stats["literalMemberships"] = sum(len(words) for words in words_by_literal.values())
    return words_by_literal, dict(sorted(stats.items()))
