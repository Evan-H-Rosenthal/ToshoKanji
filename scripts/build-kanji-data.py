#!/usr/bin/env python3
from __future__ import annotations

import gzip
import hashlib
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
WORD_DATA_DIR = ROOT / "public" / "data" / "words"
KANJI_OUT_FILE = GENERATED_DIR / "kanji.generated.ts"
RADICALS_OUT_FILE = GENERATED_DIR / "radicals.generated.ts"
COMPONENTS_OUT_FILE = GENERATED_DIR / "components.generated.ts"
WORD_PART_COUNT = 32
WORD_METADATA_TAGS = {"ateji", "gikun", "iK", "ik", "io", "oK", "ok", "rK", "rk", "sk"}
WORD_METADATA_TAG_ALIASES = {
    "ateji (phonetic) reading": "ateji",
    "gikun (meaning as reading) or jukujikun (special kanji reading)": "gikun",
    "word containing irregular kanji usage": "iK",
    "word containing irregular kana usage": "ik",
    "irregular okurigana usage": "io",
    "word containing out-dated kanji or kanji usage": "oK",
    "out-dated or obsolete kana usage": "ok",
    "rarely used kanji form": "rK",
    "rarely used kana form": "rk",
    "search-only kanji form": "sk",
    "search-only kana form": "sk",
}

KANJIDIC2_URL = "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz"
JMDICT_E_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"
KRADFILE_URL = "http://ftp.edrdg.org/pub/Nihongo/kradfile.gz"
RADKFILE_URL = "http://ftp.edrdg.org/pub/Nihongo/radkfile.gz"

KANJIDIC2_GZ = CACHE_DIR / "kanjidic2.xml.gz"
JMDICT_E_GZ = CACHE_DIR / "JMdict_e.gz"
KRADFILE_GZ = CACHE_DIR / "kradfile.gz"
RADKFILE_GZ = CACHE_DIR / "radkfile.gz"

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

DEFAULT_LEARNING_CATEGORY = "Misc"
FALLBACK_LEARNING_CATEGORIES = {"", "Misc", "Fallback", "MiscFallback", "Misc & Fallback"}
LEARNING_CATEGORY_ALIASES = {"WeatherEnvironment": "Colors", "Weather & Environment": "Colors"}

RADICAL_METADATA = {
    9: {"variants": ["亻"], "names": ["ひと", "にんべん"]},
    18: {"variants": ["刂"], "names": ["かたな", "りっとう"]},
    47: {"variants": ["\u5ddd"]},
    49: {"variants": ["\u5df2"]},
    61: {"variants": ["忄", "㣺"], "names": ["こころ", "りっしんべん", "したごころ"]},
    64: {"variants": ["扌"], "names": ["て", "てへん"]},
    66: {"variants": ["\u6535"]},
    80: {"variants": ["\u6bcd"]},
    85: {"variants": ["氵"], "names": ["みず", "さんずい"]},
    86: {"variants": ["灬"], "names": ["ひ", "れっか"]},
    94: {"variants": ["犭"], "names": ["いぬ", "けものへん"]},
    96: {"variants": ["王"], "names": ["たま", "おうへん"]},
    113: {"variants": ["礻", "⺭"], "names": ["しめす", "しめすへん"]},
    118: {"variants": ["⺮"], "names": ["たけ", "たけかんむり"]},
    120: {"variants": ["糹"], "names": ["いと", "いとへん"]},
    122: {"variants": ["\u7f52"]},
    140: {"variants": ["艹"], "names": ["くさ", "くさかんむり"]},
    145: {"variants": ["衤"], "names": ["ころも", "ころもへん"]},
    146: {"variants": ["\u897f"]},
    149: {"variants": ["訁"], "names": ["ことば", "ごんべん"]},
    162: {"variants": ["⻌", "辶"], "names": ["しんにょう"]},
    170: {"variants": ["阝"], "names": ["おか", "こざとへん"]},
    163: {"variants": ["阝"], "names": ["むら", "おおざと"]},
    199: {"variants": ["\u9ea6"]},
    201: {"variants": ["\u9ec4"]},
    203: {"variants": ["\u9ed2"]},
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

CURATED_KRAD_DISPLAY_FORMS = {
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

# RADKFILE predates Unicode support for several lookup glyphs and names image
# assets instead. These mappings keep the source group while choosing a modern
# text glyph for learner-facing display.
RADK_IMAGE_DISPLAY_FORMS = {
    "js01": "\u4ebb",
    "js03": "\u8279",
    "js04": "\u2e8c",
    "js05": "\u8002",
    "kozatoL": "\u961d",
    "kozatoR": "\u961d",
}

# The same U+961D glyph represents two distinct radical families. RADKFILE's
# image name disambiguates the source group.
RADK_RADICAL_NUMBER_OVERRIDES = {
    "\u90a6": 163,
    "\u9621": 170,
}

SMALL_YOON = {
    "\u3083": "ya",
    "\u3085": "yu",
    "\u3087": "yo",
}

SMALL_VOWELS = {
    "\u3041": "a",
    "\u3043": "i",
    "\u3045": "u",
    "\u3047": "e",
    "\u3049": "o",
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
    "\u3094": "vu",
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
    "\u3067": "dy",
    "\u306b": "ny",
    "\u3072": "hy",
    "\u3075": "fy",
    "\u3073": "by",
    "\u3074": "py",
    "\u307f": "my",
    "\u308a": "ry",
}

HEPBURN_FOREIGN_STEMS = {
    "\u3046": "",
    "\u3094": "v",
    "\u304f": "kw",
    "\u3050": "gw",
    "\u3057": "sh",
    "\u3058": "j",
    "\u3061": "ch",
    "\u3064": "ts",
    "\u3066": "t",
    "\u3067": "d",
    "\u3068": "t",
    "\u3069": "d",
    "\u3075": "f",
}

ROMAJI_PUNCTUATION = {
    "\u3001": ",",
    "\u3002": ".",
    "\u30fb": "-",
    "\uff0c": ",",
    "\uff0e": ".",
    "\uff1a": ":",
    "\uff1b": ";",
    "\uff01": "!",
    "\uff1f": "?",
    "\u301c": "-",
    "\uff5e": "-",
    "\u300c": "",
    "\u300d": "",
    "\u300e": "",
    "\u300f": "",
    "\uff08": "(",
    "\uff09": ")",
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
        if char in ROMAJI_PUNCTUATION:
            morae.append(ROMAJI_PUNCTUATION[char])
            index += 1
            continue
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
        elif next_char in SMALL_VOWELS and char in HEPBURN_FOREIGN_STEMS:
            romaji = HEPBURN_FOREIGN_STEMS[char] + SMALL_VOWELS[next_char]
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


def priority_score(entry: ET.Element) -> tuple[int, int, int]:
    priorities: list[str] = []
    for path in ("k_ele/ke_pri", "r_ele/re_pri"):
        priorities.extend(node.text or "" for node in entry.findall(path))

    bucket = 3
    nf_rank = 999
    for pri in priorities:
        if pri in {"news1", "ichi1", "spec1", "gai1"}:
            bucket = min(bucket, 0)
        elif pri in {"news2", "ichi2", "spec2", "gai2"}:
            bucket = min(bucket, 1)
        elif pri.startswith("nf"):
            try:
                bucket = min(bucket, 2)
                nf_rank = min(nf_rank, int(pri[2:]))
            except ValueError:
                bucket = min(bucket, 2)

    return bucket, nf_rank, len(priorities)


def jmdict_readings_for_entry(entry: ET.Element, japanese: str) -> list[str]:
    readings: list[str] = []
    for reading_elem in entry.findall("r_ele"):
        reading = reading_elem.findtext("reb")
        if not reading:
            continue
        restrictions = [node.text for node in reading_elem.findall("re_restr") if node.text]
        if restrictions and japanese not in restrictions:
            continue
        readings.append(reading)
    return readings


def normalize_word_metadata_tag(value: str | None) -> str | None:
    if not value:
        return None
    if value in WORD_METADATA_TAGS:
        return value
    return WORD_METADATA_TAG_ALIASES.get(value)


def jmdict_word_tags(entry: ET.Element, japanese: str, furigana: str) -> list[str]:
    tags: set[str] = set()

    for kanji_elem in entry.findall("k_ele"):
        if kanji_elem.findtext("keb") != japanese:
            continue
        tags.update(tag for tag in (normalize_word_metadata_tag(node.text) for node in kanji_elem.findall("ke_inf")) if tag)

    for reading_elem in entry.findall("r_ele"):
        reading = reading_elem.findtext("reb")
        if reading != furigana:
            continue
        restrictions = [node.text for node in reading_elem.findall("re_restr") if node.text]
        if restrictions and japanese not in restrictions:
            continue
        tags.update(tag for tag in (normalize_word_metadata_tag(node.text) for node in reading_elem.findall("re_inf")) if tag)

    return [tag for tag in ("ateji", "gikun", "iK", "ik", "io", "oK", "ok", "rK", "rk", "sk") if tag in tags]


def jmdict_texts(entry: ET.Element, paths: tuple[str, ...]) -> list[str]:
    return [node.text or "" for path in paths for node in entry.findall(path) if node.text]


def weirdness_penalty(entry: ET.Element, japanese: str, readings: list[str]) -> int:
    texts = " ".join(jmdict_texts(entry, ("sense/misc", "sense/pos", "sense/field"))).lower()
    penalty = 0
    if re.fullmatch(r"[0-9０-９〇零一二三四五六七八九十百千万億兆]+", japanese):
        penalty += 10
    if not readings:
        penalty += 6
    for marker, value in (
        ("archaic", 8),
        ("archaism", 8),
        ("obsolete", 8),
        ("obscure", 7),
        ("rare", 6),
        ("numeric", 5),
        ("surname", 6),
        ("given name", 6),
        ("person's name", 6),
        ("place name", 6),
        ("company name", 6),
        ("organization name", 6),
        ("product name", 6),
        ("work of art", 5),
    ):
        if marker in texts:
            penalty += value
    return penalty


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

            glosses = [node.text for node in elem.findall("sense/gloss") if node.text]
            if not glosses:
                elem.clear()
                continue

            priority_bucket, nf_rank, priority_count = priority_score(elem)
            common = priority_count > 0
            meaning = "; ".join(glosses[:2])

            for literal in matched_literals:
                japanese = next((keb for keb in kebs if literal in keb), kebs[0])
                readings = jmdict_readings_for_entry(elem, japanese)
                furigana = next((reading for reading in readings if kana_re.match(reading)), readings[0] if readings else "")
                has_reading = bool(furigana)
                word_tags = jmdict_word_tags(elem, japanese, furigana)
                words_by_literal[literal].append({
                    "id": f"w-{japanese}",
                    "japanese": japanese,
                    "furigana": furigana,
                    "romaji": kana_to_hepburn(furigana),
                    "meaning": meaning,
                    "common": common,
                    **({"wordTags": word_tags} if word_tags else {}),
                    "_priorityBucket": priority_bucket,
                    "_nfRank": nf_rank,
                    "_priorityCount": priority_count,
                    "_hasReading": has_reading,
                    "_weirdnessPenalty": weirdness_penalty(elem, japanese, readings),
                })

            elem.clear()

    for literal, words in words_by_literal.items():
        seen = set()
        unique = []
        for word in sorted(
            words,
            key=lambda w: (
                w["_priorityBucket"],
                w["_nfRank"],
                not w["common"],
                len(w["japanese"]),
                not w["_hasReading"],
                w["_weirdnessPenalty"],
                -w["_priorityCount"],
                w["japanese"],
                w["furigana"],
            ),
        ):
            if word["japanese"] in seen:
                continue
            seen.add(word["japanese"])
            word.pop("_priorityBucket", None)
            word.pop("_nfRank", None)
            word.pop("_priorityCount", None)
            word.pop("_hasReading", None)
            word.pop("_weirdnessPenalty", None)
            unique.append(word)
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
            components = raw_components.split()
            components_by_literal[literal] = unique_values(components)

    return components_by_literal

def decode_radk_alternate_glyph(code: str) -> str | None:
    if not re.fullmatch(r"[0-9A-Fa-f]{4}", code):
        return None
    try:
        row = int(code[:2], 16) + 0x80
        cell = int(code[2:], 16) + 0x80
        return bytes([0x8F, row, cell]).decode("euc-jp")
    except (ValueError, UnicodeDecodeError):
        return None


def parse_radkfile() -> dict[str, dict]:
    metadata_by_source_char: dict[str, dict] = {}

    with gzip.open(RADKFILE_GZ, "rt", encoding="euc-jp") as file:
        for line_number, line in enumerate(file, start=1):
            line = line.strip()
            if not line.startswith("$"):
                continue

            fields = line.split()
            if len(fields) < 3:
                continue

            source_char = fields[1]
            try:
                stroke_count = int(fields[2])
            except ValueError:
                continue

            alternate = fields[3] if len(fields) > 3 else None
            alternate_glyph = decode_radk_alternate_glyph(alternate) if alternate else None
            image_name = alternate if alternate and not alternate_glyph else None
            display_char = (
                alternate_glyph
                or (RADK_IMAGE_DISPLAY_FORMS.get(image_name) if image_name else None)
                or CURATED_KRAD_DISPLAY_FORMS.get(source_char)
                or source_char
            )
            if alternate_glyph:
                representation = "alternate-glyph"
            elif image_name and image_name in RADK_IMAGE_DISPLAY_FORMS:
                representation = "image-glyph"
            elif image_name:
                representation = "image-label"
            elif display_char != source_char:
                representation = "curated-display"
            else:
                representation = "direct"

            metadata_by_source_char[source_char] = {
                "sourceChar": source_char,
                "char": display_char,
                "strokeCount": stroke_count,
                "representation": representation,
                "radkLine": line_number,
                **({"alternateCode": alternate, "alternateChar": alternate_glyph} if alternate_glyph else {}),
                **({"sourceImage": image_name} if image_name else {}),
            }

    return metadata_by_source_char



def pick_milestone_kanji(entries: dict[str, dict], count: int = 100) -> list[dict]:
    def sort_key(entry: dict) -> tuple[bool, int, str]:
        return (entry["frequency"] is None, entry["frequency"] or 99999, entry["literal"])

    selected: list[dict] = []
    seen_literals: set[str] = set()

    for grade in (1, 2, 3, 4, 5, 6, 8, 9, 10):
        grade_entries = [entry for entry in entries.values() if entry["grade"] == grade]
        grade_entries.sort(key=sort_key)
        for entry in grade_entries:
            if entry["literal"] in seen_literals:
                continue
            selected.append(entry)
            seen_literals.add(entry["literal"])
            if len(selected) >= count:
                return selected

    remaining = [entry for entry in entries.values() if entry["literal"] not in seen_literals]
    remaining.sort(key=sort_key)
    selected.extend(remaining[: max(0, count - len(selected))])
    return selected


def unique_values(values: list[str]) -> list[str]:
    seen = set()
    unique = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        unique.append(value)
    return unique


def krad_component_id(source_char: str) -> str:
    codepoints = "-".join(f"{ord(char):x}" for char in source_char)
    return f"c-k-u{codepoints}"



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




def radical_number_for_component(component: str) -> int | None:
    for index, radical_char in enumerate(KANGXI_RADICALS, start=1):
        metadata = RADICAL_METADATA.get(index, {})
        if component == radical_char or component in metadata.get("variants", []) or component == PREFERRED_VISIBLE_VARIANT.get(index):
            return index
    return None


def build_krad_component_registry(radk_metadata: dict[str, dict]) -> dict[str, dict]:
    registry: dict[str, dict] = {}
    for source_char, metadata in radk_metadata.items():
        char = metadata["char"]
        radical_number = RADK_RADICAL_NUMBER_OVERRIDES.get(source_char) or radical_number_for_component(char)
        descriptor = {**metadata}
        if radical_number:
            radical_id = f"r-{radical_number}"
            canonical_char = KANGXI_RADICALS[radical_number - 1]
            descriptor["radicalId"] = radical_id
            descriptor["radicalNumber"] = radical_number
            if char == canonical_char:
                descriptor["componentKind"] = "canonical-radical"
                descriptor["componentId"] = radical_component_id(radical_id)
            else:
                descriptor["componentKind"] = "radical-variant"
                descriptor["componentId"] = radical_variant_component_id(radical_id, char)
                descriptor["canonicalComponentId"] = radical_component_id(radical_id)
        else:
            descriptor["componentKind"] = "visual-component"
            descriptor["componentId"] = krad_component_id(source_char)
        registry[source_char] = descriptor
    return registry


def resolve_krad_component(source_char: str, registry: dict[str, dict]) -> dict:
    resolved = registry.get(source_char)
    if resolved:
        return dict(resolved)
    display_char = CURATED_KRAD_DISPLAY_FORMS.get(source_char, source_char)
    return {
        "sourceChar": source_char,
        "char": display_char,
        "representation": "curated-display" if display_char != source_char else "direct",
        "componentKind": "visual-component",
        "componentId": krad_component_id(source_char),
        "missingRadkMetadata": True,
    }


def unique_component_descriptors(components: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for component in components:
        key = component.get("componentId") or f"{component.get('sourceChar')}:{component.get('char')}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(component)
    return unique


def build_kanji_parts(components: list[dict]) -> list[dict]:
    parts = []
    for descriptor in components:
        visible = descriptor.get("visible", True)
        if descriptor.get("official"):
            role = "official"
        elif not visible:
            role = "raw-fragment"
        else:
            role = "component"

        part = {
            "component": descriptor["char"],
            "role": role,
            "componentKind": descriptor["componentKind"],
            "representation": descriptor.get("representation", "direct"),
        }
        source_char = descriptor.get("sourceChar")
        if source_char and source_char != descriptor["char"]:
            part["sourceComponent"] = source_char
        if visible and descriptor.get("componentId"):
            part["componentId"] = descriptor["componentId"]
        if descriptor.get("radicalId"):
            part["radicalId"] = descriptor["radicalId"]
        if descriptor.get("canonicalComponentId"):
            part["canonicalComponentId"] = descriptor["canonicalComponentId"]
        if descriptor.get("sourceImage"):
            part["sourceImage"] = descriptor["sourceImage"]
        if descriptor.get("alternateCode"):
            part["alternateCode"] = descriptor["alternateCode"]
        if descriptor.get("strokeCount") is not None:
            part["sourceStrokeCount"] = descriptor["strokeCount"]
        if descriptor.get("hiddenReason"):
            part["hiddenReason"] = descriptor["hiddenReason"]
        if descriptor.get("missingRadkMetadata"):
            part["missingRadkMetadata"] = True
        parts.append(part)
    return parts



def public_kanji_parts(parts: list[dict]) -> list[dict]:
    public_keys = {"component", "role", "componentId", "radicalId"}
    return [
        {key: value for key, value in part.items() if key in public_keys}
        for part in parts
    ]

def is_allowed_visible_component(descriptor: dict, official_radical_form: str) -> bool:
    component = descriptor["char"]
    source_component = descriptor.get("sourceChar", component)
    if descriptor.get("official") or component == official_radical_form:
        return True
    if component in VISIBLE_COMPONENT_ALLOWLIST or source_component in VISIBLE_COMPONENT_ALLOWLIST:
        return True
    return component not in FORBIDDEN_VISIBLE_COMPONENTS and source_component not in FORBIDDEN_VISIBLE_COMPONENTS


def build_component_provenance(
    raw_components: list[str],
    visible_parts: list[dict],
    filtered_components: list[str],
    hidden_self_components: list[str],
) -> dict:
    return {
        "source": "RADKFILE/KRADFILE",
        "extractionMethod": "KRADFILE lookup groups resolved with RADKFILE display metadata and radical-family normalization",
        "confidence": "high",
        "rawComponentCount": len(raw_components),
        "visibleComponentCount": len(visible_parts),
        "filteredComponents": filtered_components,
        "hiddenSelfComponents": hidden_self_components,
    }


def build_learner_parts(visible_parts: list[dict]) -> list[dict]:
    learner_parts = []
    for part in visible_parts:
        if part.get("role") == "official":
            role = "official-radical"
            source = "radical-metadata"
        elif part.get("componentKind") == "radical-variant":
            role = "radical-variant"
            source = "radk-resolved"
        else:
            role = "visual-component"
            source = "radk-resolved"

        learner_part = {
            "char": part["component"],
            "role": role,
            "source": source,
            "componentId": part["componentId"],
        }
        representation = part.get("representation", "direct")
        if representation not in {"direct", "official-radical"}:
            learner_part["representation"] = representation
        for source_key, output_key in (
            ("sourceComponent", "sourceChar"),
            ("radicalId", "radicalId"),
            ("sourceImage", "sourceImage"),
            ("alternateCode", "alternateCode"),
        ):
            if part.get(source_key):
                learner_part[output_key] = part[source_key]
        learner_parts.append(learner_part)
    return learner_parts


def build_raw_decomposition(raw_parts: list[dict], filtered_components: list[str], hidden_self_components: list[str]) -> dict:
    parts = []
    for part in raw_parts:
        if part.get("role") == "raw-fragment":
            role = "raw-fragment"
        elif part.get("radicalId"):
            role = "source-radical"
        else:
            role = "source-component"

        source_char = part.get("sourceComponent") or part["component"]
        raw_part = {
            "char": source_char,
            "role": role,
            "debugOnly": True,
        }
        if part["component"] != source_char:
            raw_part["displayChar"] = part["component"]
        representation = part.get("representation", "direct")
        if representation not in {"direct", "official-radical"}:
            raw_part["representation"] = representation
        if part.get("componentId"):
            raw_part["componentId"] = part["componentId"]
        if part.get("radicalId"):
            raw_part["radicalId"] = part["radicalId"]
        if part.get("sourceImage"):
            raw_part["sourceImage"] = part["sourceImage"]
        if part.get("hiddenReason"):
            raw_part["hiddenReason"] = part["hiddenReason"]
        if part.get("missingRadkMetadata"):
            raw_part["missingRadkMetadata"] = True
        parts.append(raw_part)

    return {
        "source": "RADKFILE/KRADFILE",
        "parts": parts,
        "filteredParts": filtered_components,
        "hiddenSelfParts": hidden_self_components,
        "confidence": "high",
    }

def build_radicals(
    selected_kanji: list[dict],
    all_entries: dict[str, dict],
    components_by_literal: dict[str, list[str]],
    component_registry: dict[str, dict],
) -> list[dict]:
    selected_ids = {entry["literal"]: f"k-{entry['literal']}" for entry in selected_kanji}
    official_radical_numbers = {entry["radicalNumber"] for entry in selected_kanji if entry["radicalNumber"]}
    component_radical_numbers = {
        number
        for entry in selected_kanji
        for component in components_by_literal.get(entry["literal"], [])
        for number in [component_registry.get(component, {}).get("radicalNumber")]
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
            or any(component_registry.get(component, {}).get("radicalNumber") == number for component in components_by_literal.get(entry["literal"], []))
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


def read_existing_learning_categories() -> dict[str, str]:
    if not KANJI_OUT_FILE.exists():
        return {}

    text = KANJI_OUT_FILE.read_text(encoding="utf-8")
    match = re.search(r"export const KANJI: KanjiEntry\[\] = (\[.*\]);", text, re.DOTALL)
    if not match:
        return {}

    try:
        entries = json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}

    categories: dict[str, str] = {}
    for entry in entries:
        kanji_id = entry.get("id")
        learning_category = entry.get("learningCategory")
        if kanji_id and isinstance(learning_category, str) and learning_category not in FALLBACK_LEARNING_CATEGORIES:
            categories[kanji_id] = LEARNING_CATEGORY_ALIASES.get(learning_category, learning_category)

    return categories


def build_kanji(
    selected_kanji: list[dict],
    words_by_literal: dict[str, list[dict]],
    components_by_literal: dict[str, list[str]],
    existing_learning_categories: dict[str, str],
    component_registry: dict[str, dict],
) -> list[dict]:
    kanji_entries = []
    for entry in selected_kanji:
        literal = entry["literal"]
        kanji_id = f"k-{literal}"
        radical_number = entry["radicalNumber"]
        radical_id = f"r-{radical_number}" if radical_number else "r-unknown"
        radical_char = KANGXI_RADICALS[radical_number - 1] if radical_number and 0 < radical_number <= len(KANGXI_RADICALS) else ""
        visible_form = visible_radical_form(entry, radical_char) if radical_char else None
        official_radical_form = visible_form or radical_char

        official_kind = "canonical-radical" if official_radical_form == radical_char else "radical-variant"
        official_descriptor = {
            "char": official_radical_form,
            "official": True,
            "visible": True,
            "representation": "official-radical",
            "componentKind": official_kind,
            "componentId": (
                radical_component_id(radical_id)
                if official_kind == "canonical-radical"
                else radical_variant_component_id(radical_id, official_radical_form)
            ),
            "radicalId": radical_id,
            **(
                {"canonicalComponentId": radical_component_id(radical_id)}
                if official_kind == "radical-variant"
                else {}
            ),
        }

        raw_krad_components = components_by_literal.get(literal, [])
        resolved_krad_components = [
            resolve_krad_component(source_char, component_registry)
            for source_char in raw_krad_components
        ]
        filtered_components: list[str] = []
        hidden_self_components: list[str] = []
        visible_krad_components: list[dict] = []
        raw_krad_descriptors: list[dict] = []

        for descriptor in resolved_krad_components:
            descriptor = dict(descriptor)
            source_char = descriptor.get("sourceChar", descriptor["char"])
            allowed = is_allowed_visible_component(descriptor, official_radical_form)
            direct_self = descriptor.get("representation") == "direct" and descriptor["char"] == literal
            if not allowed:
                descriptor["visible"] = False
                descriptor["hiddenReason"] = "source-fragment"
                filtered_components.append(source_char)
            elif direct_self:
                descriptor["visible"] = False
                descriptor["hiddenReason"] = "direct-self-membership"
                hidden_self_components.append(source_char)
            else:
                descriptor["visible"] = True
                visible_krad_components.append(descriptor)
            raw_krad_descriptors.append(descriptor)

        visible_descriptors = unique_component_descriptors([official_descriptor, *visible_krad_components])
        raw_descriptors = unique_component_descriptors([official_descriptor, *raw_krad_descriptors])
        visible_components = build_kanji_parts(visible_descriptors)
        raw_component_parts = build_kanji_parts(raw_descriptors)
        component_ids = unique_values([part["componentId"] for part in visible_components])
        words = words_by_literal.get(literal, [])
        raw_components = unique_values([official_radical_form, *raw_krad_components]) if official_radical_form else raw_krad_components

        kanji_entries.append({
            "id": kanji_id,
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
            "learnerParts": build_learner_parts(visible_components),
            "rawDecomposition": build_raw_decomposition(raw_component_parts, filtered_components, hidden_self_components),
            "learningCategory": existing_learning_categories.get(kanji_id, DEFAULT_LEARNING_CATEGORY),
        })

    return kanji_entries

def build_words(kanji_entries: list[dict], words_by_literal: dict[str, list[dict]]) -> list[dict]:
    kanji_by_literal = {entry["char"]: entry["id"] for entry in kanji_entries}
    word_rank_by_kanji_id = {
        entry["id"]: {
            word.get("id") or f"w-{word['japanese']}": rank
            for rank, word in enumerate(words_by_literal.get(entry["char"], []))
        }
        for entry in kanji_entries
    }
    words_by_id: dict[str, dict] = {}

    for kanji in kanji_entries:
        for word in words_by_literal.get(kanji["char"], []):
            word_id = word.get("id") or f"w-{word['japanese']}"
            kanji_ids = unique_values([
                kanji_by_literal[char]
                for char in word["japanese"]
                if char in kanji_by_literal
            ])
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
                "kanjiRanks": [
                    word_rank_by_kanji_id.get(kanji_id, {}).get(word_id, 1_000_000)
                    for kanji_id in kanji_ids
                ],
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

    for kanji in kanji_entries:
        for part in kanji.get("learnerParts", []):
            component_id = part.get("componentId")
            if not component_id:
                continue
            component = components_by_id.get(component_id)
            if not component:
                if part.get("role") != "visual-component":
                    continue
                component = ensure_component(
                    component_id,
                    part["char"],
                    "visual-component",
                    "RADKFILE/KRADFILE lookup element",
                    forms=[part["char"]],
                )
                if part.get("sourceChar"):
                    component["sourceChar"] = part["sourceChar"]
                component["representation"] = part.get("representation", "direct")
                if part.get("sourceImage"):
                    component["sourceImage"] = part["sourceImage"]
                if part.get("alternateCode"):
                    component["alternateCode"] = part["alternateCode"]
            component["kanjiIds"] = unique_values([*component["kanjiIds"], kanji["id"]])

    return sorted(
        components_by_id.values(),
        key=lambda component: (
            {"canonical-radical": 0, "radical-variant": 1, "visual-component": 2}.get(component["kind"], 9),
            component.get("radicalNumber") or 999,
            component["char"],
            component["id"],
        ),
    )


def ts_literal(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def chunked(values: list[dict], chunk_count: int) -> list[list[dict]]:
    chunk_size = max(1, (len(values) + chunk_count - 1) // chunk_count)
    return [values[index : index + chunk_size] for index in range(0, len(values), chunk_size)]


def write_generated_files(kanji_entries: list[dict], radical_entries: list[dict], component_entries: list[dict], word_entries: list[dict]) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    kanji_output = f"""import type {{ KanjiEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from KANJIDIC2, JMdict_e, and RADKFILE/KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const KANJI: KanjiEntry[] = {ts_literal(kanji_entries)};
"""

    radicals_output = f"""import type {{ RadicalEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from KANJIDIC2 and RADKFILE/KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const RADICALS: RadicalEntry[] = {ts_literal(radical_entries)};
"""

    components_output = f"""import type {{ ComponentEntry }} from "../../types";

// Generated by scripts/build-kanji-data.py from Kangxi radical metadata and RADKFILE/KRADFILE.
// Do not hand-edit this file; update the generator or source data instead.

export const COMPONENTS: ComponentEntry[] = {ts_literal(component_entries)};
"""

    for stale_word_part in GENERATED_DIR.glob("words.part-*.generated.ts"):
        stale_word_part.unlink()
    stale_words_module = GENERATED_DIR / "words.generated.ts"
    if stale_words_module.exists():
        stale_words_module.unlink()

    WORD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for stale_word_part in WORD_DATA_DIR.glob("part-*.json"):
        stale_word_part.unlink()

    word_chunks = chunked(word_entries, WORD_PART_COUNT)
    for index, word_chunk in enumerate(word_chunks, start=1):
        (WORD_DATA_DIR / f"part-{index}.json").write_text(
            json.dumps(word_chunk, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    digest_payload = "\n".join(
        json.dumps([word["id"], word.get("kanjiRanks", [])], ensure_ascii=False, separators=(",", ":"))
        for word in word_entries
    )
    digest = hashlib.sha256(digest_payload.encode("utf-8")).hexdigest()[:16]
    manifest = {
        "version": digest,
        "count": len(word_entries),
        "parts": [f"/data/words/part-{index}.json?v={digest}" for index in range(1, len(word_chunks) + 1)],
    }
    (WORD_DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    KANJI_OUT_FILE.write_text(kanji_output, encoding="utf-8")
    RADICALS_OUT_FILE.write_text(radicals_output, encoding="utf-8")
    COMPONENTS_OUT_FILE.write_text(components_output, encoding="utf-8")



def main() -> None:
    download_if_missing(KANJIDIC2_URL, KANJIDIC2_GZ)
    download_if_missing(JMDICT_E_URL, JMDICT_E_GZ)
    download_if_missing(KRADFILE_URL, KRADFILE_GZ)
    download_if_missing(RADKFILE_URL, RADKFILE_GZ)

    all_entries = parse_kanjidic2()
    selected_kanji = pick_milestone_kanji(all_entries, 800)
    target_literals = {entry["literal"] for entry in selected_kanji}
    existing_learning_categories = read_existing_learning_categories()
    words_by_literal = parse_jmdict_words(target_literals)
    components_by_literal = parse_kradfile()
    radk_metadata = parse_radkfile()
    component_registry = build_krad_component_registry(radk_metadata)

    radicals = build_radicals(selected_kanji, all_entries, components_by_literal, component_registry)
    kanji = build_kanji(
        selected_kanji,
        words_by_literal,
        components_by_literal,
        existing_learning_categories,
        component_registry,
    )
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
