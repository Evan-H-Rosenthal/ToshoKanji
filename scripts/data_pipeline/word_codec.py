from __future__ import annotations

# Versioned positional encoding used only at the word-shard storage boundary.
# The in-memory model remains named and source-complete.
ENCODING = "tosho-word-array-v1"


def _trim(values: list) -> list:
    while values and values[-1] is None:
        values.pop()
    return values


def encode_sense(sense: dict) -> list:
    return _trim([
        sense["index"], sense["glosses"], sense.get("partsOfSpeech"),
        sense.get("fields"), sense.get("usageLabels"), sense.get("dialects"), sense.get("notes"),
    ])


def decode_sense(value: list) -> dict:
    result = {"index": value[0], "glosses": value[1]}
    for index, key in enumerate(("partsOfSpeech", "fields", "usageLabels", "dialects", "notes"), start=2):
        if len(value) > index and value[index] is not None:
            result[key] = value[index]
    return result


def encode_word_record(record: dict) -> list:
    word = record["word"]
    source = word["source"]
    encoded_word = _trim([
        word["japanese"], word["furigana"], word["romaji"], word["meaning"],
        1 if word.get("common") else 0,
        [encode_sense(sense) for sense in word["senses"]],
        source["entryId"], source["spellingIndex"], source["readingIndex"],
        word.get("wordTags"), word.get("priorityTags"), word.get("information"),
        word.get("usageLabels"), word.get("romanizationStatus"),
    ])
    return [record["id"], encoded_word, record["kanjiIds"], record.get("kanjiRanks", [])]


def decode_word_record(value: list) -> dict:
    record_id, encoded, kanji_ids, kanji_ranks = value
    word = {
        "id": record_id,
        "japanese": encoded[0],
        "furigana": encoded[1],
        "romaji": encoded[2],
        "meaning": encoded[3],
        "common": bool(encoded[4]),
        "senses": [decode_sense(sense) for sense in encoded[5]],
        "source": {
            "dataset": "JMdict_e",
            "entryId": encoded[6],
            "spellingIndex": encoded[7],
            "readingIndex": encoded[8],
        },
    }
    for index, key in enumerate(("wordTags", "priorityTags", "information", "usageLabels", "romanizationStatus"), start=9):
        if len(encoded) > index and encoded[index] is not None:
            word[key] = encoded[index]
    return {"id": record_id, "word": word, "kanjiIds": kanji_ids, "kanjiRanks": kanji_ranks}
