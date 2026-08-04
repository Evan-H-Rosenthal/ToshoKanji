from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / ".cache" / "datasets"
CURATED_DIR = ROOT / "data" / "curated"
SOURCE_LOCK_FILE = ROOT / "data" / "source-lock.json"
GENERATED_DIR = ROOT / "src" / "app" / "data" / "generated"
WORD_DATA_DIR = ROOT / "public" / "data" / "words"
SOURCE_MANIFEST_FILE = ROOT / "public" / "data" / "source-manifest.json"
KANJI_OUT_FILE = GENERATED_DIR / "kanji.generated.ts"
RADICALS_OUT_FILE = GENERATED_DIR / "radicals.generated.ts"
COMPONENTS_OUT_FILE = GENERATED_DIR / "components.generated.ts"
MILESTONE_FILE = CURATED_DIR / "kanji-milestone.json"
CATEGORY_FILE = CURATED_DIR / "learning-categories.json"
ROMANIZER_FILE = ROOT / "scripts" / "romanize-kana.mjs"
WORD_PART_COUNT = 32

SOURCE_SPECS = {
    "kanjidic2": {"url": "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz", "path": CACHE_DIR / "kanjidic2.xml.gz"},
    "jmdict_e": {"url": "https://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz", "path": CACHE_DIR / "JMdict_e.gz"},
    "kradfile": {"url": "https://ftp.edrdg.org/pub/Nihongo/kradfile.gz", "path": CACHE_DIR / "kradfile.gz"},
    "radkfile": {"url": "https://ftp.edrdg.org/pub/Nihongo/radkfile.gz", "path": CACHE_DIR / "radkfile.gz"},
}
KANJIDIC2_GZ = SOURCE_SPECS["kanjidic2"]["path"]
JMDICT_E_GZ = SOURCE_SPECS["jmdict_e"]["path"]
KRADFILE_GZ = SOURCE_SPECS["kradfile"]["path"]
RADKFILE_GZ = SOURCE_SPECS["radkfile"]["path"]

# Unicode's 214 Kangxi radical symbols normalized to unified ideographs.
import unicodedata
KANGXI_RADICALS = [unicodedata.normalize("NFKC", chr(0x2F00 + index)) for index in range(214)]
KANGXI_RADICALS[62] = "\u6238"  # Japanese form used by KANJIDIC/RADKFILE
KANGXI_RADICALS[173] = "\u9752"

# Radical-family relationships are derived from exact Kangxi forms or from
# Unicode radical names present in KRADFILE's own source-to-Unicode header map.
# There is intentionally no per-Kanji preferred-form or forbidden-shape table.

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


def unique_values(values):
    seen = set()
    result = []
    for value in values:
        if value in (None, "") or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def read_curated_data() -> tuple[list[str], dict[str, str], str]:
    milestone = json.loads(MILESTONE_FILE.read_text(encoding="utf-8"))
    category_data = json.loads(CATEGORY_FILE.read_text(encoding="utf-8"))
    literals = milestone.get("kanji", [])
    categories = category_data.get("categories", {})
    default_category = category_data.get("defaultCategory", "Misc")
    if len(literals) != len(set(literals)):
        raise RuntimeError("The curated milestone contains duplicate characters")
    literal_set = set(literals)
    missing = [literal for literal in literals if literal not in categories]
    extra = [literal for literal in categories if literal not in literal_set]
    if missing or extra:
        raise RuntimeError(f"Category coverage differs from milestone membership: missing={missing}, extra={extra}")
    return literals, categories, default_category
