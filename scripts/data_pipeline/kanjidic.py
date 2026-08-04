from __future__ import annotations

import gzip
import xml.etree.ElementTree as ET

from .config import KANJIDIC2_GZ


def int_text(node: ET.Element | None) -> int | None:
    if node is None or node.text is None:
        return None
    try:
        return int(node.text)
    except ValueError:
        return None


def parse_kanjidic2() -> dict[str, dict]:
    entries: dict[str, dict] = {}
    with gzip.open(KANJIDIC2_GZ, "rb") as source:
        for _, element in ET.iterparse(source, events=("end",)):
            if element.tag != "character":
                continue
            literal = element.findtext("literal")
            if not literal:
                element.clear()
                continue
            misc = element.find("misc")
            radical_number = None
            for radical in element.findall("radical/rad_value"):
                if radical.attrib.get("rad_type") == "classical":
                    radical_number = int_text(radical)
                    break
            onyomi: list[str] = []
            kunyomi: list[str] = []
            meanings: list[str] = []
            rmgroup = element.find("reading_meaning/rmgroup")
            if rmgroup is not None:
                for reading in rmgroup.findall("reading"):
                    value = reading.text
                    if not value:
                        continue
                    if reading.attrib.get("r_type") == "ja_on":
                        onyomi.append(value)
                    elif reading.attrib.get("r_type") == "ja_kun":
                        kunyomi.append(value)
                for meaning in rmgroup.findall("meaning"):
                    if meaning.attrib.get("m_lang") is None and meaning.text:
                        meanings.append(meaning.text)
            entries[literal] = {
                "literal": literal,
                "strokeCount": int_text(misc.find("stroke_count") if misc is not None else None),
                "grade": int_text(misc.find("grade") if misc is not None else None),
                "frequency": int_text(misc.find("freq") if misc is not None else None),
                "jlptOld": int_text(misc.find("jlpt") if misc is not None else None),
                "radicalNumber": radical_number,
                "onyomi": onyomi,
                "kunyomi": kunyomi,
                "meanings": meanings,
                "radNames": [node.text for node in element.findall("misc/rad_name") if node.text],
            }
            element.clear()
    return entries


def select_curated_kanji(entries: dict[str, dict], literals: list[str]) -> list[dict]:
    missing = [literal for literal in literals if literal not in entries]
    if missing:
        raise RuntimeError(f"Curated milestone characters missing from KANJIDIC2: {missing}")
    return [entries[literal] for literal in literals]
