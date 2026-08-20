#!/usr/bin/env python3
"""Extract EXIF + file metadata from Phase 1A soil photos into one JSON per image.

Reads every JPEG/HEIC in the input directory and writes ``<stem>.json`` beside it
(or into ``--output-dir``). Missing fields are recorded as ``null`` and logged as
warnings - a photo with no GPS still produces a JSON file, it just has no
coordinates.

Usage:
    python scripts/extract-iphone-metadata.py
    python scripts/extract-iphone-metadata.py --input-dir data/phase-1a/raw
    python scripts/extract-iphone-metadata.py --skip-existing

Dependencies: Pillow. HEIC support additionally needs ``pillow-heif``.
See scripts/requirements-phase-1a.txt.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image
    from PIL.ExifTags import GPSTAGS, TAGS
except ImportError:  # pragma: no cover - environment guard
    sys.exit("Pillow is required. Install it with: pip install Pillow")

# HEIC is the iPhone default format. Without pillow-heif we can still hash the
# file and read its size, but not its EXIF - so warn loudly rather than fail.
try:
    import pillow_heif

    pillow_heif.register_heif_opener()
    HEIC_SUPPORTED = True
except ImportError:
    HEIC_SUPPORTED = False

LOG = logging.getLogger("extract-iphone-metadata")

DEFAULT_INPUT_DIR = Path("data/phase-1a/raw")
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".heic", ".heif", ".png", ".tif", ".tiff"}
HEIC_SUFFIXES = {".heic", ".heif"}

EXIF_IFD_TAG = 0x8769
GPS_IFD_TAG = 0x8825


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def sha256_of(path: Path, chunk_size: int = 1 << 20) -> str:
    """Stream the file through SHA-256 so large photos never load fully in RAM."""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def to_float(value) -> float | None:
    """Coerce EXIF rationals (IFDRational, (num, den) tuples) to float."""
    if value is None:
        return None
    try:
        if isinstance(value, tuple) and len(value) == 2:
            numerator, denominator = value
            return float(numerator) / float(denominator) if denominator else None
        return float(value)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def dms_to_decimal(dms, ref: str | None) -> float | None:
    """Convert an EXIF (degrees, minutes, seconds) triple to signed decimal degrees."""
    try:
        degrees, minutes, seconds = (to_float(part) for part in dms)
    except (TypeError, ValueError):
        return None
    if degrees is None or minutes is None or seconds is None:
        return None
    decimal = degrees + minutes / 60.0 + seconds / 3600.0
    if ref and ref.upper() in ("S", "W"):
        decimal = -decimal
    return round(decimal, 6)


def parse_exif_datetime(raw: str | None) -> str | None:
    """EXIF stores 'YYYY:MM:DD HH:MM:SS'. Return ISO 8601, or None if unparseable."""
    if not raw:
        return None
    try:
        return datetime.strptime(str(raw).strip(), "%Y:%m:%d %H:%M:%S").isoformat()
    except ValueError:
        LOG.warning("Unrecognised EXIF timestamp %r - leaving null", raw)
        return None


def format_shutter_speed(exposure_time) -> str | None:
    """Render ExposureTime the way a photographer reads it: 1/120, or 2.5s."""
    seconds = to_float(exposure_time)
    if seconds is None or seconds <= 0:
        return None
    if seconds >= 1:
        return f"{seconds:g}s"
    return f"1/{round(1 / seconds)}"


def decode(value):
    """EXIF strings sometimes arrive as bytes; normalise and trim NUL padding."""
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="replace")
    if isinstance(value, str):
        return value.strip().strip("\x00").strip() or None
    return value


# --------------------------------------------------------------------------- #
# EXIF extraction
# --------------------------------------------------------------------------- #


def read_exif(path: Path) -> dict:
    """Pull the fields Phase 1A cares about out of one image.

    Never raises: any failure degrades to nulls plus a warning, so one bad photo
    cannot stop a 20-sample batch.
    """
    blank = {
        "gps_lat": None,
        "gps_lon": None,
        "gps_altitude_m": None,
        "timestamp": None,
        "camera_make": None,
        "camera_model": None,
        "lens_model": None,
        "focal_length": None,
        "focal_length_35mm": None,
        "iso": None,
        "shutter_speed": None,
        "aperture_f_number": None,
        "image_width": None,
        "image_height": None,
        "orientation": None,
    }

    if path.suffix.lower() in HEIC_SUFFIXES and not HEIC_SUPPORTED:
        LOG.warning(
            "%s is HEIC but pillow-heif is not installed - no EXIF will be read. "
            "Install it with: pip install pillow-heif",
            path.name,
        )
        return blank

    try:
        with Image.open(path) as img:
            blank["image_width"], blank["image_height"] = img.size
            exif = img.getexif()
    except Exception as exc:  # noqa: BLE001 - deliberately broad: keep the batch alive
        LOG.warning("Could not read EXIF from %s: %s", path.name, exc)
        return blank

    if not exif:
        LOG.warning("%s has no EXIF block at all (re-saved or messenger-stripped?)", path.name)
        return blank

    base = {TAGS.get(tag, tag): value for tag, value in exif.items()}
    exif_ifd = exif.get_ifd(EXIF_IFD_TAG) or {}
    detail = {TAGS.get(tag, tag): value for tag, value in exif_ifd.items()}

    blank["camera_make"] = decode(base.get("Make"))
    blank["camera_model"] = decode(base.get("Model"))
    blank["lens_model"] = decode(detail.get("LensModel"))
    blank["orientation"] = base.get("Orientation")

    # DateTimeOriginal is when the shutter fired; DateTime is when the file was
    # last written, which editing changes. Prefer the former.
    blank["timestamp"] = parse_exif_datetime(
        decode(detail.get("DateTimeOriginal"))
        or decode(detail.get("DateTimeDigitized"))
        or decode(base.get("DateTime"))
    )

    focal = to_float(detail.get("FocalLength"))
    if focal is not None:
        blank["focal_length"] = f"{focal:g}mm"
    focal_35 = detail.get("FocalLengthIn35mmFilm")
    if focal_35:
        blank["focal_length_35mm"] = f"{int(focal_35)}mm"

    iso = detail.get("ISOSpeedRatings") or detail.get("PhotographicSensitivity")
    if isinstance(iso, (list, tuple)):
        iso = iso[0] if iso else None
    blank["iso"] = int(iso) if iso is not None else None

    blank["shutter_speed"] = format_shutter_speed(detail.get("ExposureTime"))

    f_number = to_float(detail.get("FNumber"))
    if f_number is not None:
        blank["aperture_f_number"] = round(f_number, 2)

    gps_ifd = exif.get_ifd(GPS_IFD_TAG) or {}
    if gps_ifd:
        gps = {GPSTAGS.get(tag, tag): value for tag, value in gps_ifd.items()}
        blank["gps_lat"] = dms_to_decimal(gps.get("GPSLatitude"), decode(gps.get("GPSLatitudeRef")))
        blank["gps_lon"] = dms_to_decimal(gps.get("GPSLongitude"), decode(gps.get("GPSLongitudeRef")))
        altitude = to_float(gps.get("GPSAltitude"))
        if altitude is not None:
            # GPSAltitudeRef == 1 means below sea level.
            if gps.get("GPSAltitudeRef") in (1, b"\x01"):
                altitude = -altitude
            blank["gps_altitude_m"] = round(altitude, 2)

    if blank["gps_lat"] is None or blank["gps_lon"] is None:
        LOG.warning(
            "%s has no GPS data - fill gps_lat/gps_lon in checklist-responses.csv by hand",
            path.name,
        )
    if blank["timestamp"] is None:
        LOG.warning("%s has no capture timestamp - falling back to file mtime", path.name)
    if blank["iso"] is not None and blank["iso"] > 800:
        LOG.warning(
            "%s was shot at ISO %d (>800) - likely underlit and noisy; consider a reshoot",
            path.name,
            blank["iso"],
        )

    return blank


def read_file_info(path: Path) -> dict:
    stat = path.stat()
    return {
        "size_bytes": stat.st_size,
        "hash_sha256": sha256_of(path),
        "modified_utc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        # st_ctime is creation time on Windows but inode-change time on Unix.
        # Recorded for traceability only - never trusted as the capture time.
        "fs_ctime_utc": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
    }


def process_image(path: Path, output_dir: Path) -> Path | None:
    """Write one <stem>.json. Returns the path written, or None on failure."""
    try:
        record = {
            "filename": path.name,
            "exif": read_exif(path),
            "file_info": read_file_info(path),
        }
    except Exception as exc:  # noqa: BLE001
        LOG.error("Failed to process %s: %s", path.name, exc)
        return None

    # No EXIF timestamp: fall back to file mtime so downstream always has a date.
    if record["exif"]["timestamp"] is None:
        record["exif"]["timestamp"] = record["file_info"]["modified_utc"]
        record["exif"]["timestamp_source"] = "file_mtime"
    else:
        record["exif"]["timestamp_source"] = "exif"

    destination = output_dir / f"{path.stem}.json"
    try:
        destination.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    except OSError as exc:
        LOG.error("Could not write %s: %s", destination, exc)
        return None

    LOG.info(
        "%s -> %s (gps=%s, time=%s, iso=%s)",
        path.name,
        destination.name,
        "yes" if record["exif"]["gps_lat"] is not None else "NO",
        record["exif"]["timestamp"],
        record["exif"]["iso"],
    )
    return destination


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help=f"Directory of soil photos (default: {DEFAULT_INPUT_DIR})",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Where to write the JSON files (default: same as --input-dir)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Leave images alone when their JSON already exists",
    )
    parser.add_argument("--quiet", action="store_true", help="Only report warnings and errors")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    input_dir: Path = args.input_dir
    output_dir: Path = args.output_dir or input_dir

    if not input_dir.is_dir():
        LOG.error("Input directory does not exist: %s", input_dir)
        return 1
    output_dir.mkdir(parents=True, exist_ok=True)

    images = sorted(p for p in input_dir.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES)
    if not images:
        LOG.error("No images found in %s (looked for %s)", input_dir, ", ".join(sorted(IMAGE_SUFFIXES)))
        return 1

    if any(p.suffix.lower() in HEIC_SUFFIXES for p in images) and not HEIC_SUPPORTED:
        LOG.warning("HEIC images present but pillow-heif is missing: pip install pillow-heif")

    written = skipped = failed = 0
    for image in images:
        if args.skip_existing and (output_dir / f"{image.stem}.json").exists():
            LOG.info("%s: JSON already exists, skipping", image.name)
            skipped += 1
            continue
        if process_image(image, output_dir):
            written += 1
        else:
            failed += 1

    LOG.warning(
        "Done: %d written, %d skipped, %d failed (of %d images)",
        written,
        skipped,
        failed,
        len(images),
    )
    # Failures are reported but never fatal - a partial batch is still useful.
    return 0 if written or skipped else 1


if __name__ == "__main__":
    raise SystemExit(main())
