from __future__ import annotations

import gzip
import hashlib
import json
import shutil
import struct
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from .config import KANJIDIC2_GZ, ROOT, SOURCE_LOCK_FILE, SOURCE_SPECS


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def gzip_timestamp(path: Path) -> str | None:
    with path.open("rb") as source:
        header = source.read(10)
    timestamp = struct.unpack("<I", header[4:8])[0] if len(header) >= 8 else 0
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat() if timestamp else None


def download_source(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".download")
    request = urllib.request.Request(url, headers={"User-Agent": "ToshoKanji data builder"})
    print(f"Downloading {url}")
    try:
        with urllib.request.urlopen(request) as response, temporary.open("wb") as output:
            shutil.copyfileobj(response, output)
        if temporary.stat().st_size == 0:
            raise RuntimeError(f"Downloaded source is empty: {url}")
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()


def kanjidic_version() -> dict:
    with gzip.open(KANJIDIC2_GZ, "rb") as source:
        for _, element in ET.iterparse(source, events=("end",)):
            if element.tag == "header":
                return {child.tag: child.text for child in element}
    raise RuntimeError("KANJIDIC2 header was not found")


def source_fingerprints() -> dict:
    fingerprints = {
        name: {
            "url": spec["url"],
            "file": str(spec["path"].relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256_file(spec["path"]),
            "bytes": spec["path"].stat().st_size,
            "gzipTimestamp": gzip_timestamp(spec["path"]),
        }
        for name, spec in SOURCE_SPECS.items()
    }
    fingerprints["kanjidic2"]["database"] = kanjidic_version()
    return fingerprints


def ensure_sources(refresh: bool = False, update_lock: bool = False) -> dict:
    lock = json.loads(SOURCE_LOCK_FILE.read_text(encoding="utf-8")) if SOURCE_LOCK_FILE.exists() else None
    if not lock and not update_lock:
        raise RuntimeError("data/source-lock.json is missing; use --update-source-lock after reviewing the cached sources")

    for spec in SOURCE_SPECS.values():
        if refresh or not spec["path"].exists():
            download_source(spec["url"], spec["path"])

    fingerprints = source_fingerprints()
    if update_lock:
        lock = {
            "schemaVersion": 1,
            "description": "Reviewed upstream source files used for reproducible ToshoKanji data builds.",
            "sources": fingerprints,
        }
        SOURCE_LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
        SOURCE_LOCK_FILE.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return lock

    for name, actual in fingerprints.items():
        expected = lock.get("sources", {}).get(name)
        if not expected or expected.get("sha256") != actual["sha256"]:
            raise RuntimeError(f"Pinned source mismatch for {name}; review it and update the lock intentionally")
    return lock
