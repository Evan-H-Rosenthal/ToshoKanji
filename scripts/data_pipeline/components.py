from __future__ import annotations

import gzip
import re
import unicodedata

from .config import (
    KANGXI_RADICALS,
    KRADFILE_GZ,
    RADKFILE_GZ,
    unique_values,
)


def parse_kradfile() -> tuple[dict[str, list[str]], dict[str, str]]:
    components: dict[str, list[str]] = {}
    display_forms: dict[str, str] = {}
    mapping_pattern = re.compile(r"^#\s+(\S+)\s+U\+([0-9A-Fa-f]+)\s*$")
    with gzip.open(KRADFILE_GZ, "rt", encoding="euc-jp") as source:
        for line in source:
            stripped = line.strip()
            mapping = mapping_pattern.match(stripped)
            if mapping:
                display_forms[mapping.group(1)] = chr(int(mapping.group(2), 16))
                continue
            if not stripped or stripped.startswith("#") or " : " not in stripped:
                continue
            literal, raw = stripped.split(" : ", 1)
            components[literal] = unique_values(raw.split())
    return components, display_forms


def decode_radk_alternate_glyph(code: str) -> str | None:
    if not re.fullmatch(r"[0-9A-Fa-f]{4}", code):
        return None
    try:
        row = int(code[:2], 16) + 0x80
        cell = int(code[2:], 16) + 0x80
        return bytes([0x8F, row, cell]).decode("euc-jp")
    except (ValueError, UnicodeDecodeError):
        return None


def parse_radkfile(display_forms: dict[str, str]) -> dict[str, dict]:
    metadata: dict[str, dict] = {}
    with gzip.open(RADKFILE_GZ, "rt", encoding="euc-jp") as source:
        for line_number, line in enumerate(source, start=1):
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
            source_mapped_glyph = display_forms.get(source_char)
            display_char = alternate_glyph or source_mapped_glyph or source_char
            if alternate_glyph:
                representation = "alternate-glyph"
            elif image_name and source_mapped_glyph:
                representation = "image-glyph"
            elif image_name:
                representation = "image-label"
            else:
                representation = "direct"
            metadata[source_char] = {
                "sourceChar": source_char,
                "char": display_char,
                "strokeCount": stroke_count,
                "representation": representation,
                "renderable": representation != "image-label",
                "radkLine": line_number,
                **({"alternateCode": alternate, "alternateChar": alternate_glyph} if alternate_glyph else {}),
                **({"sourceImage": image_name} if image_name else {}),
                **({"sourceMappedChar": source_mapped_glyph} if source_mapped_glyph else {}),
            }
    return metadata


def krad_component_id(source_char: str) -> str:
    return "c-k-u" + "-".join(f"{ord(char):x}" for char in source_char)


def radical_component_id(radical_id: str) -> str:
    return f"c-{radical_id}"


def radical_variant_component_id(radical_id: str, variant: str) -> str:
    codepoints = "-".join(f"{ord(char):x}" for char in variant)
    return f"{radical_component_id(radical_id)}-v-u{codepoints}"


def radical_number_for_form(form: str) -> int | None:
    for number, canonical in enumerate(KANGXI_RADICALS, start=1):
        if form == canonical:
            return number
    name = unicodedata.name(form, "")
    if not name.startswith("CJK RADICAL ") and not name.startswith("KANGXI RADICAL "):
        return None
    family = name.split(" RADICAL ", 1)[1]
    family = re.sub(r"\b(?:SIMPLIFIED|ONE|TWO|THREE)\b", "", family)
    family = " ".join(family.split())
    if family == "PERSON":
        family = "MAN"
    for number in range(1, 215):
        kangxi_family = unicodedata.name(chr(0x2F00 + number - 1), "").removeprefix("KANGXI RADICAL ")
        if family == kangxi_family:
            return number
    return None


def build_component_registry(radk_metadata: dict[str, dict], all_entries: dict[str, dict]) -> dict[str, dict]:
    registry: dict[str, dict] = {}
    for source_char, metadata in radk_metadata.items():
        char = metadata["char"]
        radical_number = radical_number_for_form(metadata.get("sourceMappedChar", char)) or radical_number_for_form(char)
        radical_form_evidence = None
        if not radical_number:
            character_entry = all_entries.get(char)
            if character_entry and character_entry.get("radicalNumber") and character_entry.get("radNames"):
                radical_number = character_entry["radicalNumber"]
                radical_form_evidence = "KANJIDIC2 rad_name plus KRADFILE/RADKFILE lookup form"
        descriptor = dict(metadata)
        if radical_number:
            radical_id = f"r-{radical_number}"
            descriptor.update({"radicalId": radical_id, "radicalNumber": radical_number})
            if radical_form_evidence:
                descriptor["radicalFormEvidence"] = radical_form_evidence
            if char == KANGXI_RADICALS[radical_number - 1]:
                descriptor.update({"componentKind": "canonical-radical", "componentId": radical_component_id(radical_id)})
            else:
                descriptor.update({
                    "componentKind": "radical-variant",
                    "componentId": radical_variant_component_id(radical_id, char),
                    "canonicalComponentId": radical_component_id(radical_id),
                })
        else:
            descriptor.update({"componentKind": "visual-component", "componentId": krad_component_id(source_char)})
        registry[source_char] = descriptor
    return registry


def resolve_component(source_char: str, registry: dict[str, dict]) -> dict:
    if source_char in registry:
        return dict(registry[source_char])
    return {
        "sourceChar": source_char,
        "char": source_char,
        "representation": "direct",
        "renderable": True,
        "componentKind": "visual-component",
        "componentId": krad_component_id(source_char),
        "missingRadkMetadata": True,
    }


def canonical_radical_descriptor(radical_number: int) -> dict:
    radical_id = f"r-{radical_number}"
    return {
        "sourceChar": KANGXI_RADICALS[radical_number - 1],
        "char": KANGXI_RADICALS[radical_number - 1],
        "representation": "official-radical",
        "renderable": True,
        "componentKind": "canonical-radical",
        "componentId": radical_component_id(radical_id),
        "radicalId": radical_id,
        "radicalNumber": radical_number,
        "official": True,
        "source": "KANJIDIC2 classical radical number",
        "positionedFormKnown": False,
    }


def descriptor_key(descriptor: dict) -> str:
    return descriptor.get("componentId") or f"{descriptor.get('sourceChar')}:{descriptor.get('char')}"


def unique_descriptors(descriptors: list[dict]) -> list[dict]:
    seen = set()
    result = []
    for descriptor in descriptors:
        key = descriptor_key(descriptor)
        if key in seen:
            continue
        seen.add(key)
        result.append(descriptor)
    return result


def learner_part(descriptor: dict) -> dict:
    if descriptor.get("official"):
        role = "official-radical"
    elif descriptor["componentKind"] == "radical-variant":
        role = "radical-variant"
    else:
        role = "visual-component"
    part = {
        "char": descriptor["char"],
        "role": role,
        "source": descriptor.get("source", "RADKFILE/KRADFILE"),
        "componentId": descriptor["componentId"],
        "representation": descriptor.get("representation", "direct"),
    }
    for source_key, output_key in (
        ("sourceChar", "sourceChar"),
        ("radicalId", "radicalId"),
        ("sourceImage", "sourceImage"),
        ("alternateCode", "alternateCode"),
        ("positionedFormKnown", "positionedFormKnown"),
        ("radicalFormEvidence", "radicalFormEvidence"),
    ):
        if source_key in descriptor:
            part[output_key] = descriptor[source_key]
    return part


def raw_part(descriptor: dict) -> dict:
    if descriptor.get("official") and descriptor.get("source") == "KANJIDIC2 classical radical number":
        role = "source-radical"
    elif descriptor.get("radicalId"):
        role = "source-radical"
    else:
        role = "source-component"
    part = {
        "char": descriptor.get("sourceChar", descriptor["char"]),
        "role": role,
        "debugOnly": True,
        "representation": descriptor.get("representation", "direct"),
    }
    if descriptor["char"] != part["char"]:
        part["displayChar"] = descriptor["char"]
    for key in ("componentId", "radicalId", "sourceImage", "alternateCode", "hiddenReason", "missingRadkMetadata"):
        if key in descriptor:
            part[key] = descriptor[key]
    return part


def build_radicals(selected: list[dict], all_entries: dict[str, dict], components_by_literal: dict[str, list[str]], registry: dict[str, dict]) -> list[dict]:
    selected_ids = {entry["literal"]: f"k-{entry['literal']}" for entry in selected}
    numbers = {entry["radicalNumber"] for entry in selected if entry["radicalNumber"]}
    numbers.update(
        descriptor.get("radicalNumber")
        for entry in selected
        for source_char in components_by_literal.get(entry["literal"], [])
        for descriptor in [resolve_component(source_char, registry)]
        if descriptor.get("radicalNumber")
    )
    variants_by_number: dict[int, list[str]] = {}
    for descriptor in registry.values():
        number = descriptor.get("radicalNumber")
        if number and descriptor.get("char") != KANGXI_RADICALS[number - 1]:
            variants_by_number.setdefault(number, []).append(descriptor["char"])
    radicals = []
    for number in sorted(numbers):
        canonical = KANGXI_RADICALS[number - 1]
        character = all_entries.get(canonical)
        names = unique_values([
            name
            for entry in all_entries.values()
            if entry.get("radicalNumber") == number
            for name in entry.get("radNames", [])
        ])
        kanji_ids = [
            selected_ids[entry["literal"]]
            for entry in selected
            if entry.get("radicalNumber") == number
            or any(resolve_component(source_char, registry).get("radicalNumber") == number for source_char in components_by_literal.get(entry["literal"], []))
        ]
        radicals.append({
            "id": f"r-{number}",
            "componentId": radical_component_id(f"r-{number}"),
            "char": canonical,
            "meanings": [],
            "characterMeanings": character.get("meanings", []) if character else [],
            "strokes": character.get("strokeCount", 0) if character else 0,
            "kanjiIds": unique_values(kanji_ids),
            "radicalNumber": number,
            "variants": unique_values(variants_by_number.get(number, [])),
            "names": names,
            "source": "KANJIDIC2 classical radical number; forms normalized by Unicode/EDRDG metadata",
        })
    return radicals


def build_kanji(selected: list[dict], components_by_literal: dict[str, list[str]], registry: dict[str, dict]) -> list[dict]:
    result = []
    for entry in selected:
        literal = entry["literal"]
        radical_number = entry.get("radicalNumber")
        if not radical_number:
            raise RuntimeError(f"KANJIDIC2 has no classical radical for curated kanji {literal}")
        resolved = [resolve_component(source_char, registry) for source_char in components_by_literal.get(literal, [])]
        visible: list[dict] = []
        hidden_self: list[str] = []
        unrenderable: list[str] = []
        raw_descriptors: list[dict] = []
        for descriptor in resolved:
            descriptor = dict(descriptor)
            source_char = descriptor.get("sourceChar", descriptor["char"])
            is_evidenced_radical_self = (
                descriptor.get("representation") == "direct"
                and descriptor["char"] == literal
                and descriptor.get("radicalNumber") == radical_number
                and descriptor.get("radicalFormEvidence")
            )
            if descriptor.get("representation") == "direct" and descriptor["char"] == literal and not is_evidenced_radical_self:
                descriptor["hiddenReason"] = "direct-self-membership"
                hidden_self.append(source_char)
            elif not descriptor.get("renderable", True):
                descriptor["hiddenReason"] = "source-image-required"
                unrenderable.append(source_char)
            else:
                visible.append(descriptor)
            raw_descriptors.append(descriptor)

        official_candidates = [descriptor for descriptor in visible if descriptor.get("radicalNumber") == radical_number]
        if official_candidates:
            official = dict(official_candidates[0])
            official.update({
                "official": True,
                "source": official.get("radicalFormEvidence", "KANJIDIC2 radical family matched to KRADFILE/RADKFILE form"),
                "positionedFormKnown": True,
            })
            visible = [official if descriptor_key(item) == descriptor_key(official) else item for item in visible]
        else:
            official = canonical_radical_descriptor(radical_number)

        visible = unique_descriptors(visible)
        raw_descriptors = unique_descriptors(raw_descriptors)
        official_radical = {
            "id": f"r-{radical_number}",
            "char": KANGXI_RADICALS[radical_number - 1],
            "formSource": official["source"],
            "positionedFormKnown": official.get("positionedFormKnown", False),
        }
        if official.get("positionedFormKnown"):
            official_radical["form"] = official["char"]
        result.append({
            "id": f"k-{literal}",
            "char": literal,
            "meanings": entry["meanings"],
            "onyomi": entry["onyomi"],
            "kunyomi": entry["kunyomi"],
            "strokeCount": entry["strokeCount"],
            "grade": entry["grade"],
            "frequency": entry["frequency"],
            "jlptOld": entry["jlptOld"],
            "officialRadical": official_radical,
            "radicalIds": [f"r-{radical_number}"],
            "learnerParts": [learner_part(descriptor) for descriptor in visible],
            "rawDecomposition": {
                "source": "KRADFILE with RADKFILE display metadata",
                "parts": [raw_part(descriptor) for descriptor in raw_descriptors],
                "sourceComponents": components_by_literal.get(literal, []),
                "unrenderableParts": unrenderable,
                "hiddenSelfParts": hidden_self,
                "interpretation": "visual lookup elements; not semantic or etymological claims",
                "confidence": "source-backed",
            },
        })
    return result


def character_info(char: str, all_entries: dict[str, dict]) -> dict | None:
    entry = all_entries.get(char)
    if not entry:
        return None
    return {
        "char": char,
        "meanings": entry.get("meanings", []),
        "onyomi": entry.get("onyomi", []),
        "kunyomi": entry.get("kunyomi", []),
        **({"grade": entry["grade"]} if entry.get("grade") is not None else {}),
    }


def character_metadata(char: str, all_entries: dict[str, dict]) -> dict:
    info = character_info(char, all_entries)
    if not info:
        return {}
    return {
        "characterMeanings": info["meanings"],
        "characterOnyomi": info["onyomi"],
        "characterKunyomi": info["kunyomi"],
        **({"characterGrade": info["grade"]} if "grade" in info else {}),
    }


def build_components(kanji_entries: list[dict], radical_entries: list[dict], all_entries: dict[str, dict]) -> list[dict]:
    components: dict[str, dict] = {}

    def ensure(component_id: str, char: str, kind: str, source: str, **extra) -> dict:
        if component_id not in components:
            components[component_id] = {
                "id": component_id,
                "char": char,
                "kind": kind,
                "kanjiIds": [],
                "source": source,
                **character_metadata(char, all_entries),
                **extra,
            }
        return components[component_id]

    for radical in radical_entries:
        canonical = ensure(
            radical["componentId"], radical["char"], "canonical-radical", radical["source"],
            radicalId=radical["id"], radicalNumber=radical["radicalNumber"],
            forms=unique_values([radical["char"], *radical.get("variants", [])]),
        )
        canonical["kanjiIds"] = unique_values([
            *canonical["kanjiIds"],
            *(
                kanji["id"]
                for kanji in kanji_entries
                if kanji["char"] == radical["char"]
                and kanji.get("officialRadical", {}).get("id") == radical["id"]
            ),
        ])
        for variant in radical.get("variants", []):
            ensure(
                radical_variant_component_id(radical["id"], variant), variant, "radical-variant",
                "Verified radical-family form metadata", radicalId=radical["id"],
                radicalNumber=radical["radicalNumber"], canonicalComponentId=canonical["id"], forms=[variant],
            )

    for kanji in kanji_entries:
        for part in kanji.get("learnerParts", []):
            component_id = part["componentId"]
            component = components.get(component_id)
            if not component:
                component = ensure(
                    component_id, part["char"], "visual-component", "RADKFILE/KRADFILE visual lookup element",
                    forms=[part["char"]],
                )
                component["representation"] = part.get("representation", "direct")
                for key in ("sourceImage", "alternateCode"):
                    if part.get(key):
                        component[key] = part[key]
            source_char = part.get("sourceChar")
            if source_char and source_char != part["char"]:
                component["sourceChar"] = source_char
                source_character = character_info(source_char, all_entries)
                if source_character:
                    component["sourceCharacter"] = source_character
            component["kanjiIds"] = unique_values([*component["kanjiIds"], kanji["id"]])

    return sorted(components.values(), key=lambda component: (
        {"canonical-radical": 0, "radical-variant": 1, "visual-component": 2}.get(component["kind"], 9),
        component.get("radicalNumber", 999), component["char"], component["id"],
    ))
