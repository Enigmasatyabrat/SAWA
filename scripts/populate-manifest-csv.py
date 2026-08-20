#!/usr/bin/env python3
"""Merge EXIF JSON + field checklist responses into data/phase-1a/manifest.csv.

Two sources feed each manifest row:

  * ``data/phase-1a/raw/<sample_id>.json`` - written by extract-iphone-metadata.py
    (GPS, capture time, phone model, image hash)
  * ``data/phase-1a/checklist-responses.csv`` - typed in from the printed field
    checklist (location, district, depth, weather, moisture, notes)

The manifest's own header row is the schema source of truth: columns are emitted
in exactly the order they appear there, and the ``*_later`` lab columns are left
empty until Phase 1B.

Usage:
    python scripts/populate-manifest-csv.py
    python scripts/populate-manifest-csv.py --dry-run
    python scripts/populate-manifest-csv.py --output data/phase-1a/manifest-2026-09.csv

Dependencies: standard library only.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from pathlib import Path

LOG = logging.getLogger("populate-manifest-csv")

DEFAULT_MANIFEST = Path("data/phase-1a/manifest.csv")
DEFAULT_CHECKLIST = Path("data/phase-1a/checklist-responses.csv")
DEFAULT_RAW_DIR = Path("data/phase-1a/raw")

IMAGE_SUFFIXES = (".jpg", ".jpeg", ".heic", ".heif", ".png", ".tif", ".tiff")
DEFAULT_CAPTURE_DISTANCE_CM = "15"

REQUIRED_CHECKLIST_COLUMNS = {
    "sample_id",
    "location",
    "district",
    "depth_cm",
    "weather",
    "moisture_visual",
}

VALID_WEATHER = {"sunny", "cloudy", "overcast", "drizzle"}
VALID_MOISTURE = {"dry", "moist", "wet"}


# --------------------------------------------------------------------------- #
# CSV reading (the '#' comment convention matches data/samples/manifest.csv)
# --------------------------------------------------------------------------- #


def read_csv_rows(path: Path) -> tuple[list[str], list[dict]]:
    """Return (header, rows), stripping '#' comment lines and blank lines."""
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        lines = [line for line in handle if line.strip() and not line.lstrip().startswith("#")]
    if not lines:
        raise ValueError(f"{path} contains no header row")
    reader = csv.DictReader(lines)
    return list(reader.fieldnames or []), [row for row in reader]


def read_leading_comments(path: Path) -> list[str]:
    """Preserve the template's explanatory '#' lines across regeneration."""
    if not path.exists():
        return []
    comments = []
    with path.open("r", encoding="utf-8-sig") as handle:
        for line in handle:
            stripped = line.rstrip("\r\n")
            if stripped.lstrip().startswith("#"):
                comments.append(stripped)
    return comments


def clean(value) -> str:
    return "" if value is None else str(value).strip()


# --------------------------------------------------------------------------- #
# Per-sample assembly
# --------------------------------------------------------------------------- #


def load_metadata(sample_id: str, raw_dir: Path) -> dict:
    """Load <sample_id>.json. Returns {} (with a warning) when absent or broken."""
    json_path = raw_dir / f"{sample_id}.json"
    if not json_path.exists():
        LOG.warning(
            "%s: no %s - run extract-iphone-metadata.py first. "
            "Row will be written with EXIF fields blank.",
            sample_id,
            json_path.name,
        )
        return {}
    try:
        return json.loads(json_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        LOG.warning("%s: could not read %s (%s) - EXIF fields left blank", sample_id, json_path.name, exc)
        return {}


def find_image(sample_id: str, raw_dir: Path, metadata: dict) -> str:
    """Prefer the filename recorded in the JSON; otherwise look on disk."""
    recorded = clean(metadata.get("filename"))
    if recorded and (raw_dir / recorded).exists():
        return recorded
    for suffix in IMAGE_SUFFIXES:
        candidate = raw_dir / f"{sample_id}{suffix}"
        if candidate.exists():
            return candidate.name
    if recorded:
        LOG.warning("%s: JSON names %s but that file is missing from %s", sample_id, recorded, raw_dir)
        return recorded
    LOG.warning("%s: no image file found in %s", sample_id, raw_dir)
    return ""


def split_timestamp(timestamp: str) -> tuple[str, str]:
    """'2026-09-15T14:32:00' -> ('2026-09-15', '14:32:00'). Tolerates junk."""
    timestamp = clean(timestamp)
    if not timestamp:
        return "", ""
    if "T" in timestamp:
        date_part, _, time_part = timestamp.partition("T")
    elif " " in timestamp:
        date_part, _, time_part = timestamp.partition(" ")
    else:
        return timestamp, ""
    # Drop timezone offsets and sub-second precision from the time component.
    for separator in ("+", "Z", "."):
        time_part = time_part.split(separator)[0]
    return date_part, time_part.strip()


def validate(sample_id: str, checklist_row: dict) -> None:
    """Warn on out-of-vocabulary values. Never blocks - the row is still written."""
    weather = clean(checklist_row.get("weather"))
    if weather and weather.lower() not in VALID_WEATHER:
        LOG.warning(
            "%s: weather %r is not one of %s",
            sample_id,
            weather,
            "/".join(sorted(VALID_WEATHER)),
        )
    moisture = clean(checklist_row.get("moisture_visual"))
    if moisture and moisture.lower() not in VALID_MOISTURE:
        LOG.warning(
            "%s: moisture_visual %r is not one of %s",
            sample_id,
            moisture,
            "/".join(sorted(VALID_MOISTURE)),
        )
    for numeric_field in ("depth_cm", "capture_distance_cm", "quality_score", "gps_lat", "gps_lon"):
        raw = clean(checklist_row.get(numeric_field))
        if not raw:
            continue
        try:
            float(raw)
        except ValueError:
            LOG.warning("%s: %s=%r is not a number", sample_id, numeric_field, raw)


def build_row(checklist_row: dict, raw_dir: Path) -> dict:
    """Merge one checklist row with its EXIF JSON into a manifest row dict."""
    sample_id = clean(checklist_row.get("sample_id"))
    validate(sample_id, checklist_row)

    metadata = load_metadata(sample_id, raw_dir)
    exif = metadata.get("exif") or {}
    file_info = metadata.get("file_info") or {}

    date_collected, time_collected = split_timestamp(exif.get("timestamp", ""))
    if exif.get("timestamp_source") == "file_mtime":
        LOG.warning(
            "%s: capture time came from the file's modification time, not EXIF - verify it",
            sample_id,
        )

    # A hand-entered coordinate always wins: it is only ever filled in when the
    # photo had no GPS, or when the observer knows EXIF got it wrong.
    gps_lat = clean(checklist_row.get("gps_lat")) or clean(exif.get("gps_lat"))
    gps_lon = clean(checklist_row.get("gps_lon")) or clean(exif.get("gps_lon"))
    if not gps_lat or not gps_lon:
        LOG.warning("%s: no GPS from EXIF or checklist - coordinates left blank", sample_id)

    image_hash = clean(file_info.get("hash_sha256"))
    if not image_hash:
        LOG.warning("%s: no image hash - the row cannot be tied to a specific file", sample_id)

    return {
        "sample_id": sample_id,
        "date_collected": date_collected,
        "time_collected": time_collected,
        "location": clean(checklist_row.get("location")),
        "district": clean(checklist_row.get("district")),
        "gps_lat": gps_lat,
        "gps_lon": gps_lon,
        "depth_cm": clean(checklist_row.get("depth_cm")),
        "weather": clean(checklist_row.get("weather")),
        "moisture_visual": clean(checklist_row.get("moisture_visual")),
        "phone_model": clean(exif.get("camera_model")),
        "capture_distance_cm": clean(checklist_row.get("capture_distance_cm")) or DEFAULT_CAPTURE_DISTANCE_CM,
        "image_filename": find_image(sample_id, raw_dir, metadata),
        "image_hash_sha256": image_hash,
        "quality_score": clean(checklist_row.get("quality_score")),
        "notes": clean(checklist_row.get("notes")),
    }


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #


def report_orphan_images(raw_dir: Path, known_ids: set[str]) -> None:
    """Flag photos on disk that no checklist row accounts for."""
    if not raw_dir.is_dir():
        return
    orphans = sorted(
        p.name
        for p in raw_dir.iterdir()
        if p.suffix.lower() in IMAGE_SUFFIXES and p.stem not in known_ids
    )
    for name in orphans:
        LOG.warning("%s is in %s but has no checklist row - it will not reach the manifest", name, raw_dir)


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST, help="Manifest template (supplies the schema)")
    parser.add_argument("--checklist", type=Path, default=DEFAULT_CHECKLIST, help="Field checklist responses CSV")
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW_DIR, help="Directory of images and EXIF JSON files")
    parser.add_argument("--output", type=Path, default=None, help="Where to write (default: overwrite --manifest)")
    parser.add_argument("--dry-run", action="store_true", help="Report what would be written without touching any file")
    parser.add_argument("--quiet", action="store_true", help="Only report warnings and errors")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    if not args.manifest.exists():
        LOG.error("Manifest template not found: %s", args.manifest)
        return 1
    if not args.checklist.exists():
        LOG.error("Checklist responses not found: %s", args.checklist)
        return 1

    try:
        manifest_columns, _ = read_csv_rows(args.manifest)
        checklist_columns, checklist_rows = read_csv_rows(args.checklist)
    except (OSError, ValueError) as exc:
        LOG.error("%s", exc)
        return 1

    missing = REQUIRED_CHECKLIST_COLUMNS - set(checklist_columns)
    if missing:
        LOG.error("%s is missing required column(s): %s", args.checklist, ", ".join(sorted(missing)))
        return 1

    if not checklist_rows:
        LOG.error("%s has a header but no data rows - nothing to populate", args.checklist)
        return 1

    rows: list[dict] = []
    seen_ids: set[str] = set()
    for checklist_row in checklist_rows:
        sample_id = clean(checklist_row.get("sample_id"))
        if not sample_id:
            LOG.warning("Skipping a checklist row with no sample_id: %r", checklist_row)
            continue
        if sample_id in seen_ids:
            LOG.warning("%s appears more than once in the checklist - keeping the first row only", sample_id)
            continue
        seen_ids.add(sample_id)
        rows.append(build_row(checklist_row, args.raw_dir))

    if not rows:
        LOG.error("No usable checklist rows - manifest left untouched")
        return 1

    report_orphan_images(args.raw_dir, seen_ids)

    unfillable = [c for c in manifest_columns if c not in rows[0] and not c.endswith("_later")]
    if unfillable:
        LOG.warning("Manifest column(s) %s are not produced by this script - left blank", ", ".join(unfillable))

    rows.sort(key=lambda row: row["sample_id"])
    output_path = args.output or args.manifest

    if args.dry_run:
        LOG.warning("Dry run: %d row(s) would be written to %s", len(rows), output_path)
        writer = csv.DictWriter(sys.stdout, fieldnames=manifest_columns, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
        return 0

    comments = read_leading_comments(output_path if output_path.exists() else args.manifest)
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=manifest_columns, extrasaction="ignore", lineterminator="\n")
            writer.writeheader()
            for comment in comments:
                handle.write(comment + "\n")
            writer.writerows(rows)
    except OSError as exc:
        LOG.error("Could not write %s: %s", output_path, exc)
        return 1

    complete = sum(1 for row in rows if row["gps_lat"] and row["image_hash_sha256"] and row["date_collected"])
    LOG.warning(
        "Wrote %d row(s) to %s - %d fully populated, %d with gaps (see warnings above)",
        len(rows),
        output_path,
        complete,
        len(rows) - complete,
    )
    LOG.warning("Reminder: this file now contains precise GPS coordinates. Keep it private.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
