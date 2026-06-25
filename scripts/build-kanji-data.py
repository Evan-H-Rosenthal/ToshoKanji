#!/usr/bin/env python3
from __future__ import annotations

import gzip
import json
import re
import textwrap
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / ".cache" / "datasets"
DATA_DIR = ROOT / "src" / "app" / "data"
GENERATED_DIR = DATA_DIR / "generated"
KANJI_OUT_FILE = GENERATED_DIR / "kanji.generated.ts"
RADICALS_OUT_FILE = GENERATED_DIR / "radicals.generated.ts"
COMPONENTS_OUT_FILE = GENERATED_DIR / "components.generated.ts"
WORDS_OUT_FILE = GENERATED_DIR / "words.generated.ts"

KANJIDIC2_URL = "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz"
JMDICT_E_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"
KRADFILE_URL = "http://ftp.edrdg.org/pub/Nihongo/kradfile.gz"

KANJIDIC2_GZ = CACHE_DIR / "kanjidic2.xml.gz"
JMDICT_E_GZ = CACHE_DIR / "JMdict_e.gz"
KRADFILE_GZ = CACHE_DIR / "kradfile.gz"

KANGXI_RADICALS = list(
    "一丨丶丿乙亅二亠人儿入八冂冖冫几凵刀力勹匕匚匸十卜卩厂厶又口囗土士夂夊夕大女子宀寸小尢尸屮山巛工己巾干幺广廴廾弋弓彐彡彳心戈戸手支攴文斗斤方无日曰月木欠止歹殳毋比毛氏气水火爪父爻爿片牙牛犬玄玉瓜瓦甘生用田疋疒癶白皮皿目矛矢石示禸禾穴立竹米糸缶网羊羽老而耒耳聿肉臣自至臼舌舛舟艮色艸虍虫血行衣襾見角言谷豆豕豸貝赤走足身車辛辰辵邑酉釆里金長門阜隶隹雨青非面革韋韭音頁風飛食首香馬骨高髟鬥鬯鬲鬼魚鳥鹵鹿麥麻黃黍黑黹黽鼎鼓鼠鼻齊齒龍龜龠"
)

GRADE_CATEGORY = {
    1: "grade-1",
    2: "grade-2",
    3: "grade-3",
    4: "grade-4",
    5: "grade-5",
    6: "grade-6",
    8: "joyo",
    9: "jinmeiyo",
    10: "jinmeiyo",
}

RADICAL_METADATA = {
    9: {"variants": ["亻"], "names": ["ひと", "にんべん"]},
    18: {"variants": ["刂"], "names": ["かたな", "りっとう"]},
    61: {"variants": ["忄", "㣺"], "names": ["こころ", "りっしんべん", "したごころ"]},
    64: {"variants": ["扌"], "names": ["て", "てへん"]},
    85: {"variants": ["氵"], "names": ["みず", "さんずい"]},
    86: {"variants": ["灬"], "names": ["ひ", "れっか"]},
    94: {"variants": ["犭"], "names": ["いぬ", "けものへん"]},
    96: {"variants": ["王"], "names": ["たま", "おうへん"]},
    113: {"variants": ["礻", "⺭"], "names": ["しめす", "しめすへん"]},
    118: {"variants": ["⺮"], "names": ["たけ", "たけかんむり"]},
    120: {"variants": ["糹"], "names": ["いと", "いとへん"]},
    140: {"variants": ["艹"], "names": ["くさ", "くさかんむり"]},
    145: {"variants": ["衤"], "names": ["ころも", "ころもへん"]},
    149: {"variants": ["訁"], "names": ["ことば", "ごんべん"]},
    162: {"variants": ["⻌", "辶"], "names": ["しんにょう"]},
    170: {"variants": ["阝"], "names": ["おか", "こざとへん"]},
    163: {"variants": ["阝"], "names": ["むら", "おおざと"]},
}

RAD_NAME_TO_FORM = {
    "にんべん": "亻",
    "りっとう": "刂",
    "りっしんべん": "忄",
    "したごころ": "㣺",
    "てへん": "扌",
    "さんずい": "氵",
    "れっか": "灬",
    "けものへん": "犭",
    "おうへん": "王",
    "しめすへん": "礻",
    "たけかんむり": "⺮",
    "いとへん": "糹",
    "くさかんむり": "艹",
    "ころもへん": "衤",
    "ごんべん": "訁",
    "しんにょう": "辶",
    "こざとへん": "阝",
    "おおざと": "阝",
}

PREFERRED_VISIBLE_VARIANT = {
    9: "亻",
    18: "刂",
    61: "忄",
    64: "扌",
    85: "氵",
    86: "灬",
    94: "犭",
    113: "礻",
    118: "⺮",
    120: "糹",
    140: "艹",
    145: "衤",
    149: "訁",
    162: "辶",
}

RADICAL_LEARNER_MEANINGS = {
    113: ["altar", "festival", "religious service"],
}

KRAD_COMPONENT_ALIASES = {
    "化": "亻",
    "刈": "刂",
    "忙": "忄",
    "扎": "扌",
    "汁": "氵",
    "杰": "灬",
    "犯": "犭",
    "礼": "礻",
    "竹": "⺮",
    "艾": "艹",
    "初": "衤",
    "込": "辶",
    "阡": "阝",
}

SMALL_YOON = {
    "\u3083": "ya",
    "\u3085": "yu",
    "\u3087": "yo",
}

HEPBURN_BASE = {
    "\u3042": "a",
    "\u3044": "i",
    "\u3046": "u",
    "\u3048": "e",
    "\u304a": "o",
    "\u304b": "ka",
    "\u304d": "ki",
    "\u304f": "ku",
    "\u3051": "ke",
    "\u3053": "ko",
    "\u3055": "sa",
    "\u3057": "shi",
    "\u3059": "su",
    "\u305b": "se",
    "\u305d": "so",
    "\u305f": "ta",
    "\u3061": "chi",
    "\u3064": "tsu",
    "\u3066": "te",
    "\u3068": "to",
    "\u306a": "na",
    "\u306b": "ni",
    "\u306c": "nu",
    "\u306d": "ne",
    "\u306e": "no",
    "\u306f": "ha",
    "\u3072": "hi",
    "\u3075": "fu",
    "\u3078": "he",
    "\u307b": "ho",
    "\u307e": "ma",
    "\u307f": "mi",
    "\u3080": "mu",
    "\u3081": "me",
    "\u3082": "mo",
    "\u3084": "ya",
    "\u3086": "yu",
    "\u3088": "yo",
    "\u3089": "ra",
    "\u308a": "ri",
    "\u308b": "ru",
    "\u308c": "re",
    "\u308d": "ro",
    "\u308f": "wa",
    "\u3090": "wi",
    "\u3091": "we",
    "\u3092": "o",
    "\u3093": "n",
    "\u304c": "ga",
    "\u304e": "gi",
    "\u3050": "gu",
    "\u3052": "ge",
    "\u3054": "go",
    "\u3056": "za",
    "\u3058": "ji",
    "\u305a": "zu",
    "\u305c": "ze",
    "\u305e": "zo",
    "\u3060": "da",
    "\u3062": "ji",
    "\u3065": "zu",
    "\u3067": "de",
    "\u3069": "do",
    "\u3070": "ba",
    "\u3073": "bi",
    "\u3076": "bu",
    "\u3079": "be",
    "\u307c": "bo",
    "\u3071": "pa",
    "\u3074": "pi",
    "\u3077": "pu",
    "\u307a": "pe",
    "\u307d": "po",
    "\u3041": "a",
    "\u3043": "i",
    "\u3045": "u",
    "\u3047": "e",
    "\u3049": "o",
    "\u308e": "wa",
}

HEPBURN_YOON_STEMS = {
    "\u304d": "ky",
    "\u304e": "gy",
    "\u3057": "sh",
    "\u3058": "j",
    "\u3061": "ch",
    "\u3062": "j",
    "\u306b": "ny",
    "\u3072": "hy",
    "\u3073": "by",
    "\u3074": "py",
    "\u307f": "my",
    "\u308a": "ry",
}

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

APPROVED_LEARNER_COMPONENTS: dict[str, dict] = {}


def download_if_missing(url: str, destination: Path) -> None:
    if destination.exists() and destination.stat().st_size > 0:
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url}")
    with urllib.request.urlopen(url) as response, destination.open("wb") as output:
        output.write(response.read())


def int_text(node: ET.Element | None) -> int | None:
    if node is None or node.text is None:
        return None
    try:
        return int(node.text)
    except ValueError:
        return None


def katakana_to_hiragana(value: str) -> str:
    chars = []
    for char in value:
        codepoint = ord(char)
        if 0x30A1 <= codepoint <= 0x30F6:
            chars.append(chr(codepoint - 0x60))
        else:
            chars.append(char)
    return "".join(chars)


def previous_vowel(value: str) -> str:
    for char in reversed(value):
        if char in "aeiou":
            return char
    return ""


def romanize_kana_morae(value: str) -> list[str]:
    kana = katakana_to_hiragana(value)
    morae: list[str] = []
    geminate = False
    index = 0

    while index < len(kana):
        char = kana[index]
        if char == "\u3063":
            geminate = True
            index += 1
            continue
        if char == "\u30fc":
            morae.append(previous_vowel("".join(morae)))
            index += 1
            continue

        next_char = kana[index + 1] if index + 1 < len(kana) else ""
        if next_char in SMALL_YOON and char in HEPBURN_YOON_STEMS:
            romaji = HEPBURN_YOON_STEMS[char] + SMALL_YOON[next_char][1:]
            index += 2
        else:
            romaji = HEPBURN_BASE.get(char, char)
            index += 1

        if geminate and romaji:
            romaji = ("t" if romaji.startswith("ch") else romaji[0]) + romaji
            geminate = False

        morae.append(romaji)

    if geminate:
        morae.append("tsu")

    return morae


def kana_to_hepburn(value: str) -> str:
    morae = romanize_kana_morae(value)
    adjusted: list[str] = []
    for index, mora in enumerate(morae):
        if mora == "n":
            next_mora = morae[index + 1] if index + 1 < len(morae) else ""
            if next_mora.startswith(("b", "m", "p")):
                adjusted.append("m")
            elif next_mora.startswith(("a", "e", "i", "o", "u", "y")):
                adjusted.append("n'")
            else:
                adjusted.append("n")
        else:
            adjusted.append(mora)
    return "".join(adjusted)


def parse_kanjidic2() -> dict[str, dict]:
    entries: dict[str, dict] = {}

    with gzip.open(KANJIDIC2_GZ, "rb") as file:
        for _, elem in ET.iterparse(file, events=("end",)):
            if elem.tag != "character":
                continue

            literal = elem.findtext("literal")
            if not literal:
                elem.clear()
                continue

            misc = elem.find("misc")
            stroke_count = int_text(misc.find("stroke_count") if misc is not None else None)
            grade = int_text(misc.find("grade") if misc is not None else None)
            frequency = int_text(misc.find("freq") if misc is not None else None)
            jlpt = int_text(misc.find("jlpt") if misc is not None else None)

            radical_number = None
            radical = elem.find("radical")
            if radical is not None:
                for rad_value in radical.findall("rad_value"):
                    if rad_value.attrib.get("rad_type") == "classical":
                        radical_number = int_text(rad_value)
                        break

            onyomi: list[str] = []
            kunyomi: list[str] = []
            meanings: list[str] = []

            rmgroup = elem.find("reading_meaning/rmgroup")
            if rmgroup is not None:
                for reading in rmgroup.findall("reading"):
                    value = reading.text
                    if not value:
                        continue
                    reading_type = reading.attrib.get("r_type")
                    if reading_type == "ja_on":
                        onyomi.append(value)
                    elif reading_type == "ja_kun":
                        kunyomi.append(value)

                for meaning in rmgroup.findall("meaning"):
                    if meaning.attrib.get("m_lang") is None and meaning.text:
                        meanings.append(meaning.text)

            rad_names = [node.text for node in elem.findall("misc/rad_name") if node.text]

            entries[literal] = {
                "literal": literal,
                "strokeCount": stroke_count,
                "grade": grade,
                "frequency": frequency,
                "jlptOld": jlpt,
                "radicalNumber": radical_number,
                "onyomi": onyomi,
                "kunyomi": kunyomi,
                "meanings": meanings,
                "radNames": rad_names,
            }

            elem.clear()

    return entries


def priority_score(entry: ET.Element) -> tuple[int, int]:
    priorities: list[str] = []
    for path in ("k_ele/ke_pri", "r_ele/re_pri"):
        priorities.extend(node.text or "" for node in entry.findall(path))

    score = 100
    for pri in priorities:
        if pri in {"news1", "ichi1", "spec1", "gai1"}:
            score = min(score, 0)
        elif pri in {"news2", "ichi2", "spec2", "gai2"}:
            score = min(score, 1)
        elif pri.startswith("nf"):
            try:
                score = min(score, 2 + int(pri[2:]))
            except ValueError:
                score = min(score, 50)

    return score, len(priorities)


def parse_jmdict_words(target_literals: set[str]) -> dict[str, list[dict]]:
    words_by_literal: dict[str, list[dict]] = {literal: [] for literal in target_literals}
    kana_re = re.compile(r"^[ぁ-ゖァ-ヺー]+$")

    with gzip.open(JMDICT_E_GZ, "rb") as file:
        for _, elem in ET.iterparse(file, events=("end",)):
            if elem.tag != "entry":
                continue

            kebs = [node.text for node in elem.findall("k_ele/keb") if node.text]
            if not kebs:
                elem.clear()
                continue

            matched_literals = {literal for literal in target_literals if any(literal in keb for keb in kebs)}
            if not matched_literals:
                elem.clear()
                continue

            readings = [node.text for node in elem.findall("r_ele/reb") if node.text]
            glosses = [node.text for node in elem.findall("sense/gloss") if node.text]
            if not glosses:
                elem.clear()
                continue

            score, priority_count = priority_score(elem)
            common = score < 12
            meaning = "; ".join(glosses[:2])

            for literal in matched_literals:
                japanese = next((keb for keb in kebs if literal in keb), kebs[0])
                if len(japanese) > 6:
                    continue
                furigana = next((reading for reading in readings if kana_re.match(reading)), readings[0] if readings else "")
                words_by_literal[literal].append({
                    "id": f"w-{japanese}",
                    "japanese": japanese,
                    "furigana": furigana,
                    "romaji": kana_to_hepburn(furigana),
                    "meaning": meaning,
                    "common": common,
                    "_score": score,
                    "_priorityCount": priority_count,
                })

            elem.clear()

    for literal, words in words_by_literal.items():
        seen = set()
        unique = []
        for word in sorted(words, key=lambda w: (w["_score"], len(w["japanese"]), -w["_priorityCount"], w["japanese"])):
            if word["japanese"] in seen:
                continue
            seen.add(word["japanese"])
            word.pop("_score", None)
            word.pop("_priorityCount", None)
            unique.append(word)
            if len(unique) == 3:
                break
        words_by_literal[literal] = unique

    return words_by_literal


def parse_kradfile() -> dict[str, list[str]]:
    components_by_literal: dict[str, list[str]] = {}

    with gzip.open(KRADFILE_GZ, "rt", encoding="euc-jp") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#") or " : " not in line:
                continue

            literal, raw_components = line.split(" : ", 1)
            components = [KRAD_COMPONENT_ALIASES.get(component, component) for component in raw_components.split()]
            components_by_literal[literal] = unique_values(components)

    return components_by_literal


def pick_milestone_kanji(entries: dict[str, dict], count: int = 100) -> list[dict]:
    grade_one = [entry for entry in entries.values() if entry["grade"] == 1]
    grade_two = [entry for entry in entries.values() if entry["grade"] == 2]

    grade_one.sort(key=lambda e: (e["frequency"] is None, e["frequency"] or 99999, e["literal"]))
    grade_two.sort(key=lambda e: (e["frequency"] is None, e["frequency"] or 99999, e["literal"]))

    selected = grade_one + grade_two[: max(0, count - len(grade_one))]
    return selected[:count]


def unique_values(values: list[str]) -> list[str]:
    seen = set()
    unique = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        unique.append(value)
    return unique


def component_id_for_char(component: str) -> str:
    codepoints = "-".join(f"{ord(char):x}" for char in component)
    return f"c-u{codepoints}"


def radical_component_id(radical_id: str) -> str:
    return f"c-{radical_id}"


def radical_variant_component_id(radical_id: str, variant: str) -> str:
    codepoints = "-".join(f"{ord(char):x}" for char in variant)
    return f"{radical_component_id(radical_id)}-v-u{codepoints}"


def visible_radical_form(entry: dict, radical_char: str) -> str | None:
    for rad_name in entry["radNames"]:
        form = RAD_NAME_TO_FORM.get(rad_name)
        if form and form != radical_char:
            return form
    preferred = PREFERRED_VISIBLE_VARIANT.get(entry["radicalNumber"])
    if preferred and radical_char not in entry["literal"]:
        return preferred
    return None


def build_component_radical_lookup() -> dict[str, str]:
    lookup: dict[str, str] = {}
    for index, radical_char in enumerate(KANGXI_RADICALS, start=1):
        radical_id = f"r-{index}"
        lookup[radical_char] = radical_id
        metadata = RADICAL_METADATA.get(index, {})
        for variant in metadata.get("variants", []):
            lookup[variant] = radical_id
        preferred = PREFERRED_VISIBLE_VARIANT.get(index)
        if preferred:
            lookup[preferred] = radical_id
    return lookup


def build_component_id_lookup() -> dict[str, str]:
    lookup: dict[str, str] = {}
    for index, radical_char in enumerate(KANGXI_RADICALS, start=1):
        radical_id = f"r-{index}"
        lookup[radical_char] = radical_component_id(radical_id)
        metadata = RADICAL_METADATA.get(index, {})
        for variant in metadata.get("variants", []):
            lookup[variant] = radical_variant_component_id(radical_id, variant)
        preferred = PREFERRED_VISIBLE_VARIANT.get(index)
        if preferred:
            lookup[preferred] = radical_variant_component_id(radical_id, preferred)
    for component in APPROVED_LEARNER_COMPONENTS:
        lookup[component] = component_id_for_char(component)
    return lookup


def radical_number_for_component(component: str) -> int | None:
    for index, radical_char in enumerate(KANGXI_RADICALS, start=1):
        metadata = RADICAL_METADATA.get(index, {})
        if component == radical_char or component in metadata.get("variants", []) or component == PREFERRED_VISIBLE_VARIANT.get(index):
            return index
    return None


def build_kanji_parts(
    literal: str,
    components: list[str],
    official_radical_id: str,
    official_radical_form: str,
    component_to_radical_id: dict[str, str],
    component_to_component_id: dict[str, str],
) -> list[dict]:
    parts = []
    for component in components:
        radical_id = component_to_radical_id.get(component)
        component_id = component_to_component_id.get(component)
        if radical_id == official_radical_id and component == official_radical_form:
            role = "official"
        elif component in FORBIDDEN_VISIBLE_COMPONENTS and component not in VISIBLE_COMPONENT_ALLOWLIST:
            role = "raw-fragment"
        else:
            role = "component"
        part = {
            "component": component,
            "role": role,
        }
        if component_id:
            part["componentId"] = component_id
        if radical_id:
            part["radicalId"] = radical_id
        parts.append(part)
    return parts


def is_allowed_visible_component(component: str, official_radical_form: str) -> bool:
    if component == official_radical_form:
        return True
    if component in VISIBLE_COMPONENT_ALLOWLIST:
        return True
    return component not in FORBIDDEN_VISIBLE_COMPONENTS


def build_component_provenance(raw_components: list[str], visible_parts: list[dict], filtered_components: list[str]) -> dict:
    return {
        "source": "KRADFILE",
        "extractionMethod": "kradfile components with radical alias normalization and learner-facing stroke-fragment filtering",
        "confidence": "medium",
        "rawComponentCount": len(raw_components),
        "visibleComponentCount": len(visible_parts),
        "filteredComponents": filtered_components,
    }


def build_learner_parts(literal: str, visible_parts: list[dict], official_radical_id: str, official_radical_form: str) -> list[dict]:
    learner_parts = []
    for part in visible_parts:
        old_role = part.get("role")
        if old_role == "official":
            role = "official-radical"
        else:
            role = "learner-component"

        if part.get("radicalId") == official_radical_id and part.get("component") == official_radical_form:
            source = "radical-metadata"
        else:
            source = "normalized-krad"

        learner_part = {
            "char": part["component"],
            "role": role,
            "source": source,
        }
        if part.get("componentId"):
            learner_part["componentId"] = part["componentId"]
        if part.get("radicalId"):
            learner_part["radicalId"] = part["radicalId"]
        learner_parts.append(learner_part)
    return learner_parts


def build_raw_decomposition(raw_parts: list[dict], filtered_components: list[str]) -> dict:
    parts = []
    for part in raw_parts:
        if part.get("role") == "raw-fragment":
            role = "raw-fragment"
        elif part.get("radicalId"):
            role = "source-radical"
        else:
            role = "source-component"

        raw_part = {
            "char": part["component"],
            "role": role,
            "debugOnly": True,
        }
        if part.get("componentId"):
            raw_part["componentId"] = part["componentId"]
        if part.get("radicalId"):
            raw_part["radicalId"] = part["radicalId"]
        parts.append(raw_part)

    return {
        "source": "KRADFILE",
        "parts": parts,
        "filteredParts": filtered_components,
        "confidence": "medium",
    }


def build_radicals(selected_kanji: list[dict], all_entries: dict[str, dict], components_by_literal: dict[str, list[str]]) -> list[dict]:
    selected_ids = {entry["literal"]: f"k-{entry['literal']}" for entry in selected_kanji}
    official_radical_numbers = {entry["radicalNumber"] for entry in selected_kanji if entry["radicalNumber"]}
    component_radical_numbers = {
        number
        for entry in selected_kanji
        for component in components_by_literal.get(entry["literal"], [])
        for number in [radical_number_for_component(component)]
        if number
    }
    radical_numbers = sorted(official_radical_numbers | component_radical_numbers)
    radical_entries = []

    for number in radical_numbers:
        radical_char = KANGXI_RADICALS[number - 1] if 0 < number <= len(KANGXI_RADICALS) else str(number)
        source = all_entries.get(radical_char)
        kanji_meanings = source["meanings"][:3] if source and source["meanings"] else []
        meanings = RADICAL_LEARNER_MEANINGS.get(number, kanji_meanings or [f"radical {number}"])
        strokes = source["strokeCount"] if source and source["strokeCount"] else 0
        metadata = RADICAL_METADATA.get(number, {})
        variants = unique_values([variant for variant in metadata.get("variants", []) if variant != radical_char])
        names = unique_values([*(metadata.get("names", [])), *(source["radNames"] if source else [])])
        kanji_ids = [
            selected_ids[entry["literal"]]
            for entry in selected_kanji
            if entry["radicalNumber"] == number
            or any(radical_number_for_component(component) == number for component in components_by_literal.get(entry["literal"], []))
        ]

        radical_entries.append({
            "id": f"r-{number}",
            "componentId": radical_component_id(f"r-{number}"),
            "char": radical_char,
            "meanings": meanings,
            "kanjiMeanings": kanji_meanings,
            "strokes": strokes,
            "kanjiIds": unique_values(kanji_ids),
            "radicalNumber": number,
            "variants": variants,
            "names": names,
        })

    return radical_entries


def build_kanji(selected_kanji: list[dict], words_by_literal: dict[str, list[dict]], components_by_literal: dict[str, list[str]]) -> list[dict]:
    kanji_entries = []
    component_to_radical_id = build_component_radical_lookup()
    component_to_component_id = build_component_id_lookup()
    for entry in selected_kanji:
        literal = entry["literal"]
        radical_id = f"r-{entry['radicalNumber']}" if entry["radicalNumber"] else "r-unknown"
        radical_char = KANGXI_RADICALS[entry["radicalNumber"] - 1] if entry["radicalNumber"] and 0 < entry["radicalNumber"] <= len(KANGXI_RADICALS) else ""
        visible_form = visible_radical_form(entry, radical_char) if radical_char else None
        official_radical_form = visible_form or radical_char
        krad_components = components_by_literal.get(literal, [])
        components = unique_values([official_radical_form, *krad_components]) if official_radical_form else krad_components
        filtered_components = [component for component in components if not is_allowed_visible_component(component, official_radical_form)]
        learner_components = [component for component in components if is_allowed_visible_component(component, official_radical_form)]
        visible_components = build_kanji_parts(
            literal,
            learner_components,
            radical_id,
            official_radical_form,
            component_to_radical_id,
            component_to_component_id,
        )
        raw_component_parts = build_kanji_parts(
            literal,
            components,
            radical_id,
            official_radical_form,
            component_to_radical_id,
            component_to_component_id,
        )
        component_ids = unique_values([part["componentId"] for part in visible_components if part.get("componentId")])
        words = words_by_literal.get(literal, [])

        kanji_entries.append({
            "id": f"k-{literal}",
            "literal": literal,
            "char": literal,
            "meanings": entry["meanings"][:5] or [literal],
            "onyomi": entry["onyomi"],
            "kunyomi": entry["kunyomi"],
            "strokeCount": entry["strokeCount"],
            "grade": entry["grade"],
            "frequency": entry["frequency"],
            "jlptOld": entry["jlptOld"],
            "officialRadical": {"id": radical_id, "form": official_radical_form, "char": radical_char} if radical_char else None,
            "radicalIds": [radical_id],
            "radicalForms": {radical_id: visible_form} if visible_form else {},
            "learnerParts": build_learner_parts(literal, visible_components, radical_id, official_radical_form),
            "rawDecomposition": build_raw_decomposition(raw_component_parts, filtered_components),
            "visibleComponents": visible_components,
            "rawComponents": components,
            "componentProvenance": build_component_provenance(components, visible_components, filtered_components),
            "components": [part["component"] for part in visible_components],
            "componentIds": component_ids,
            "kanjiParts": visible_components,
            "rawKanjiParts": raw_component_parts,
            "wordIds": [word["id"] for word in words if word.get("id")],
            "category": GRADE_CATEGORY.get(entry["grade"], "joyo"),
        })

    return kanji_entries


def build_words(kanji_entries: list[dict], words_by_literal: dict[str, list[dict]]) -> list[dict]:
    kanji_by_literal = {entry["char"]: entry["id"] for entry in kanji_entries}
    words_by_id: dict[str, dict] = {}

    for kanji in kanji_entries:
        for word in words_by_literal.get(kanji["char"], []):
            word_id = word.get("id") or f"w-{word['japanese']}"
            kanji_ids = [
                kanji_id
                for literal, kanji_id in kanji_by_literal.items()
                if literal in word["japanese"]
            ]
            if not kanji_ids:
                kanji_ids = [kanji["id"]]

            existing = words_by_id.get(word_id)
            if existing:
                existing["kanjiIds"] = unique_values([*existing["kanjiIds"], *kanji_ids])
                continue

            words_by_id[word_id] = {
                "id": word_id,
                "word": {**word, "id": word_id},
                "kanjiIds": kanji_ids,
            }

    return sorted(words_by_id.values(), key=lambda entry: entry["word"]["japanese"])


def build_components(kanji_entries: list[dict], radical_entries: list[dict]) -> list[dict]:
    components_by_id: dict[str, dict] = {}

    def ensure_component(
        component_id: str,
        char: str,
        kind: str,
        source: str,
        radical: dict | None = None,
        canonical_component_id: str | None = None,
        forms: list[str] | None = None,
        meanings: list[str] | None = None,
    ) -> dict:
        existing = components_by_id.get(component_id)
        if existing:
            if radical and not existing.get("radicalId"):
                existing["radicalId"] = radical["id"]
                existing["radicalNumber"] = radical.get("radicalNumber")
                existing["meanings"] = radical.get("meanings", [])
            if canonical_component_id and not existing.get("canonicalComponentId"):
                existing["canonicalComponentId"] = canonical_component_id
            if forms:
                existing["forms"] = unique_values([*(existing.get("forms") or []), *forms])
            if meanings and not existing.get("meanings"):
                existing["meanings"] = meanings
            return existing

        component = {
            "id": component_id,
            "char": char,
            "kind": kind,
            "kanjiIds": [],
            "source": source,
        }
        if radical:
            component["radicalId"] = radical["id"]
            component["radicalNumber"] = radical.get("radicalNumber")
            component["meanings"] = radical.get("meanings", [])
        if canonical_component_id:
            component["canonicalComponentId"] = canonical_component_id
        if forms:
            component["forms"] = unique_values(forms)
        if meanings:
            component["meanings"] = meanings
        components_by_id[component_id] = component
        return component

    for radical in radical_entries:
        radical_forms = unique_values([radical["char"], *(radical.get("variants") or [])])
        ensure_component(
            radical["componentId"],
            radical["char"],
            "canonical-radical",
            "Kangxi radical",
            radical,
            forms=radical_forms,
        )
        for variant in radical.get("variants", []):
            ensure_component(
                radical_variant_component_id(radical["id"], variant),
                variant,
                "radical-variant",
                "Kangxi radical variant metadata",
                radical,
                canonical_component_id=radical["componentId"],
                forms=[variant],
            )

    for component_char, metadata in APPROVED_LEARNER_COMPONENTS.items():
        ensure_component(
            component_id_for_char(component_char),
            component_char,
            "learner-component",
            metadata.get("source", "learner component metadata"),
            forms=metadata.get("forms", [component_char]),
            meanings=metadata.get("meanings", []),
        )

    for kanji in kanji_entries:
        for part in kanji.get("rawKanjiParts", []):
            component_id = part.get("componentId")
            if not component_id or component_id not in components_by_id:
                continue
            component = components_by_id[component_id]
            component["kanjiIds"] = unique_values([*component["kanjiIds"], kanji["id"]])

    return sorted(
        components_by_id.values(),
        key=lambda component: (
            {"canonical-radical": 0, "radical-variant": 1, "learner-component": 2, "raw-fragment": 3}.get(component["kind"], 9),
            component.get("radicalNumber") or 999,
            component["char"],
            component["id"],
        ),
    )


def ts_literal(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def write_generated_files(kanji_entries: list[dict], radical_entries: list[dict], component_entries: list[dict], word_entries: list[dict]) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    kanji_output = f"""import type {{ KanjiEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from KANJIDIC2, JMdict_e, and KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const KANJI: KanjiEntry[] = {ts_literal(kanji_entries)};
"""

    radicals_output = f"""import type {{ RadicalEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from KANJIDIC2 and KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const RADICALS: RadicalEntry[] = {ts_literal(radical_entries)};
"""

    components_output = f"""import type {{ ComponentEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from Kangxi radical metadata and KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const COMPONENTS: ComponentEntry[] = {ts_literal(component_entries)};
"""

    words_output = f"""import type {{ WordEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from JMdict_e and the current kanji milestone.
// Do not hand-edit this file; update the generator or source data instead.

export const WORDS: WordEntry[] = {ts_literal(word_entries)};
"""

    KANJI_OUT_FILE.write_text(kanji_output, encoding="utf-8")
    RADICALS_OUT_FILE.write_text(radicals_output, encoding="utf-8")
    COMPONENTS_OUT_FILE.write_text(components_output, encoding="utf-8")
    WORDS_OUT_FILE.write_text(words_output, encoding="utf-8")



def main() -> None:
    download_if_missing(KANJIDIC2_URL, KANJIDIC2_GZ)
    download_if_missing(JMDICT_E_URL, JMDICT_E_GZ)
    download_if_missing(KRADFILE_URL, KRADFILE_GZ)

    all_entries = parse_kanjidic2()
    selected_kanji = pick_milestone_kanji(all_entries, 100)
    target_literals = {entry["literal"] for entry in selected_kanji}
    words_by_literal = parse_jmdict_words(target_literals)
    components_by_literal = parse_kradfile()

    radicals = build_radicals(selected_kanji, all_entries, components_by_literal)
    kanji = build_kanji(selected_kanji, words_by_literal, components_by_literal)
    components = build_components(kanji, radicals)
    words = build_words(kanji, words_by_literal)

    write_generated_files(kanji, radicals, components, words)
    print(
        "Wrote "
        f"{len(kanji)} kanji, {len(radicals)} radicals, {len(components)} components, and {len(words)} words to "
        f"{GENERATED_DIR.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
