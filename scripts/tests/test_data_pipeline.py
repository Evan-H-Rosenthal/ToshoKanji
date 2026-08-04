from __future__ import annotations

import unittest
import xml.etree.ElementTree as ET
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from collections import Counter

from data_pipeline.components import build_component_registry, build_components, build_kanji, parse_kradfile, radical_number_for_form
from data_pipeline.config import KANGXI_RADICALS
from data_pipeline.jmdict import applicable_senses, priority_key
from data_pipeline.word_codec import decode_word_record, encode_word_record


class JmdictPolicyTests(unittest.TestCase):
    def test_sense_restrictions_are_applied_to_exact_form_and_reading(self):
        entry = ET.fromstring("""
        <entry>
          <sense><stagk>A</stagk><gloss>form A</gloss></sense>
          <sense><stagk>B</stagk><stagr>read-b</stagr><gloss>form B</gloss></sense>
          <sense><stagr>other-reading</stagr><gloss>other reading</gloss></sense>
        </entry>
        """)
        senses = applicable_senses(entry, "B", "read-b", Counter())
        self.assertEqual([sense["glosses"] for sense in senses], [["form B"]])

    def test_priority_uses_only_supplied_form_reading_tags(self):
        self.assertEqual(priority_key(["news1"]), (0, 999))
        self.assertEqual(priority_key(["nf03"]), (2, 3))
        self.assertEqual(priority_key([]), (3, 999))


class ComponentPolicyTests(unittest.TestCase):
    def test_exact_canonical_radical_character_is_exposed_as_bare_usage(self):
        kanji_entries = [
            {"id": "k-X", "char": "X", "officialRadical": {"id": "r-1", "char": "X"}, "learnerParts": []},
            {"id": "k-Y", "char": "Y", "officialRadical": {"id": "r-1", "char": "X"}, "learnerParts": []},
        ]
        radical_entries = [{
            "id": "r-1", "componentId": "c-r-1", "char": "X",
            "source": "test", "radicalNumber": 1, "variants": [],
        }]

        canonical = build_components(kanji_entries, radical_entries, {})[0]

        self.assertEqual(canonical["kanjiIds"], ["k-X"])

    def test_source_label_character_information_stays_separate_from_display_shape(self):
        display_shape = "\U000201a2"
        source_label = "\u4e2a"
        kanji_entries = [{
            "id": "k-test",
            "learnerParts": [{
                "componentId": "c-test", "char": display_shape,
                "sourceChar": source_label, "role": "visual-component",
                "source": "RADKFILE/KRADFILE", "representation": "image-glyph",
            }],
        }]
        all_entries = {
            display_shape: {
                "meanings": [], "onyomi": [], "kunyomi": [], "grade": None,
            },
            source_label: {
                "meanings": ["counter for articles", "individual"],
                "onyomi": ["KA"], "kunyomi": [], "grade": 9,
            },
        }

        component = build_components(kanji_entries, [], all_entries)[0]

        self.assertEqual(component["char"], display_shape)
        self.assertEqual(component["characterMeanings"], [])
        self.assertEqual(component["sourceChar"], source_label)
        self.assertEqual(component["sourceCharacter"]["char"], source_label)
        self.assertEqual(
            component["sourceCharacter"]["meanings"],
            ["counter for articles", "individual"],
        )

    def test_missing_positioned_form_keeps_canonical_classification_out_of_visible_parts(self):
        selected = [{
            "literal": "X", "meanings": [], "onyomi": [], "kunyomi": [],
            "strokeCount": 1, "grade": None, "frequency": None, "jlptOld": None,
            "radicalNumber": 18,
        }]
        built = build_kanji(selected, {"X": []}, {})[0]
        self.assertEqual(built["officialRadical"]["char"], KANGXI_RADICALS[17])
        self.assertNotIn("form", built["officialRadical"])
        self.assertFalse(built["officialRadical"]["positionedFormKnown"])
        self.assertEqual(built["learnerParts"], [])

    def test_named_radical_self_form_is_source_visible_without_character_override(self):
        registry = build_component_registry({
            "?": {
                "sourceChar": "?", "char": "?", "strokeCount": 3,
                "representation": "direct", "renderable": True,
            },
        }, {
            "?": {"radicalNumber": 47, "radNames": ["??????"]},
        })
        selected = [{
            "literal": "?", "meanings": ["stream"], "onyomi": [], "kunyomi": [],
            "strokeCount": 3, "grade": 1, "frequency": None, "jlptOld": None,
            "radicalNumber": 47,
        }]
        built = build_kanji(selected, {"?": ["?"]}, registry)[0]
        self.assertEqual(built["officialRadical"]["char"], KANGXI_RADICALS[46])
        self.assertEqual(built["officialRadical"]["form"], "?")
        self.assertTrue(built["officialRadical"]["positionedFormKnown"])
        self.assertEqual([part["char"] for part in built["learnerParts"]], ["?"])
        self.assertIn("KANJIDIC2 rad_name", built["learnerParts"][0]["source"])

    def test_unevidenced_self_lookup_remains_hidden(self):
        registry = build_component_registry({
            "?": {
                "sourceChar": "?", "char": "?", "strokeCount": 12,
                "representation": "direct", "renderable": True,
            },
        }, {
            "?": {"radicalNumber": 86, "radNames": []},
        })
        selected = [{
            "literal": "?", "meanings": ["nothingness"], "onyomi": [], "kunyomi": [],
            "strokeCount": 12, "grade": 4, "frequency": None, "jlptOld": None,
            "radicalNumber": 86,
        }]
        built = build_kanji(selected, {"?": ["?"]}, registry)[0]
        self.assertEqual(built["learnerParts"], [])
        self.assertEqual(built["rawDecomposition"]["hiddenSelfParts"], ["?"])

    def test_kangxi_number_mapping_is_complete(self):
        self.assertEqual(len(KANGXI_RADICALS), 214)
        self.assertEqual(len(set(KANGXI_RADICALS)), 214)

    def test_krad_header_unicode_radicals_resolve_without_example_overrides(self):
        _, display_forms = parse_kradfile()
        mapped_radicals = [form for form in display_forms.values() if " RADICAL " in __import__("unicodedata").name(form, "")]
        self.assertTrue(mapped_radicals)
        self.assertTrue(all(radical_number_for_form(form) for form in mapped_radicals))


class WordCodecTests(unittest.TestCase):
    def test_compact_storage_round_trips_the_source_model(self):
        record = {
            "id": "w-1-2-3",
            "word": {
                "id": "w-1-2-3", "japanese": "A", "furigana": "a", "romaji": "a",
                "meaning": "first", "common": True, "priorityTags": ["news1"],
                "senses": [{"index": 2, "glosses": ["first", "second"], "usageLabels": ["rare term"]}],
                "source": {"dataset": "JMdict_e", "entryId": "1", "spellingIndex": 2, "readingIndex": 3},
            },
            "kanjiIds": ["k-A"], "kanjiRanks": [4],
        }
        self.assertEqual(decode_word_record(encode_word_record(record)), record)


if __name__ == "__main__":
    unittest.main()
