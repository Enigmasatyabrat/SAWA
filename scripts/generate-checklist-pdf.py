#!/usr/bin/env python3
"""Generate the printable Phase 1A field checklist - one page per soil sample.

Produces an A4 PDF with a quick-reference cover page followed by one numbered
page per sample slot (SAWA-001 ... SAWA-020). Each page carries a QR code linking
back to the capture protocol so the full instructions are one scan away in the
field.

Print it, clip it to a board, fill it in with a pen, then type the answers into
data/phase-1a/checklist-responses.csv.

Usage:
    python scripts/generate-checklist-pdf.py
    python scripts/generate-checklist-pdf.py --count 40 --start 21
    python scripts/generate-checklist-pdf.py --no-cover

Dependencies: reportlab, qrcode. See scripts/requirements-phase-1a.txt.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas as pdf_canvas
except ImportError:  # pragma: no cover - environment guard
    sys.exit("reportlab is required. Install it with: pip install reportlab")

LOG = logging.getLogger("generate-checklist-pdf")

DEFAULT_OUTPUT = Path("data/phase-1a/CHECKLIST-20-SAMPLES.pdf")
PROTOCOL_URL = "https://github.com/Enigmasatyabrat/SAWA/blob/main/docs/PHASE-1A-CAPTURE-PROTOCOL.md"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 18 * mm
CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
RULE_GREY = 0.65
LABEL_SIZE = 9
FIELD_GAP = 11 * mm

FIELD_SUMMARY = [
    ("DISTANCE", "15 cm (+/- 2) - ruler-checked, lens to soil surface"),
    ("ANGLE", "90 degrees straight down - level crosshairs merged, yellow"),
    ("ZOOM", "1x always - never 2x (it is a digital crop)"),
    ("FLASH", "OFF - always, no exceptions"),
    ("LIGHT", "Open shade or light overcast, 10:00-15:00"),
    ("", "No direct sun, no golden hour, no shadow of your own on the dish"),
    ("DISH", "Same white dish every sample, soil leveled, no dish showing"),
    ("SAMPLE", "~500 g from the side wall at depth, debris out, do not dry it"),
    ("SHOTS", "3 per sample; tap centre to focus; exposure slider at 0"),
    ("CHECK", "Sharp / even light / fills frame / no glare / true colour / not dark"),
    ("GPS", "Location Services ON for Camera, Precise Location ON"),
    ("TRANSFER", "Cable, AirDrop or iCloud originals - NEVER WhatsApp"),
]


# --------------------------------------------------------------------------- #
# Drawing primitives
# --------------------------------------------------------------------------- #


def make_qr_image(url: str):
    """Return a PIL image of the QR code, or None if qrcode isn't installed."""
    try:
        import qrcode
    except ImportError:
        LOG.warning("qrcode is not installed - pages will print without a QR code "
                    "(pip install qrcode to enable it)")
        return None
    try:
        qr = qrcode.QRCode(box_size=10, border=1)
        qr.add_data(url)
        qr.make(fit=True)
        return qr.make_image(fill_color="black", back_color="white").convert("RGB")
    except Exception as exc:  # noqa: BLE001 - a missing QR must not fail the PDF
        LOG.warning("Could not build the QR code (%s) - continuing without it", exc)
        return None


def write_line(pdf, x: float, y: float, width: float) -> None:
    """A fill-in rule."""
    pdf.setStrokeGray(RULE_GREY)
    pdf.setLineWidth(0.6)
    pdf.line(x, y, x + width, y)


def label_and_line(pdf, label: str, x: float, y: float, width: float, hint: str = "") -> None:
    """Label above a fill-in rule, with an optional grey hint at the right."""
    pdf.setFillGray(0.25)
    pdf.setFont("Helvetica", LABEL_SIZE)
    pdf.drawString(x, y, label)
    if hint:
        pdf.setFillGray(0.55)
        pdf.setFont("Helvetica-Oblique", LABEL_SIZE - 1.5)
        pdf.drawRightString(x + width, y, hint)
    pdf.setFillGray(0)
    write_line(pdf, x, y - 5.5 * mm, width)


def checkbox_row(pdf, label: str, options: list[str], x: float, y: float) -> None:
    """Label followed by a row of empty tick boxes."""
    pdf.setFillGray(0.25)
    pdf.setFont("Helvetica", LABEL_SIZE)
    pdf.drawString(x, y, label)
    pdf.setFillGray(0)

    box = 3.6 * mm
    cursor = x
    baseline = y - 7 * mm
    pdf.setFont("Helvetica", LABEL_SIZE)
    for option in options:
        pdf.setStrokeGray(0.35)
        pdf.setLineWidth(0.8)
        pdf.rect(cursor, baseline, box, box, stroke=1, fill=0)
        pdf.drawString(cursor + box + 1.8 * mm, baseline + 0.6 * mm, option)
        cursor += box + 2.4 * mm + pdf.stringWidth(option, "Helvetica", LABEL_SIZE) + 6 * mm


def section_heading(pdf, text: str, x: float, y: float, width: float) -> None:
    pdf.setFillGray(0.45)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawString(x, y, text.upper())
    pdf.setStrokeGray(0.85)
    pdf.setLineWidth(0.5)
    pdf.line(x, y - 2 * mm, x + width, y - 2 * mm)
    pdf.setFillGray(0)


# --------------------------------------------------------------------------- #
# Pages
# --------------------------------------------------------------------------- #


def draw_cover(pdf, qr_image, url: str, sample_ids: list[str]) -> None:
    y = PAGE_HEIGHT - MARGIN

    pdf.setFillGray(0)
    pdf.setFont("Helvetica-Bold", 19)
    pdf.drawString(MARGIN, y - 6 * mm, "SAWA Phase 1A")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(MARGIN, y - 13 * mm, "Soil photo collection - field quick reference")

    if qr_image:
        size = 26 * mm
        pdf.drawImage(ImageReader(qr_image), PAGE_WIDTH - MARGIN - size, y - size,
                      size, size, preserveAspectRatio=True, mask="auto")
        pdf.setFillGray(0.5)
        pdf.setFont("Helvetica", 6)
        pdf.drawRightString(PAGE_WIDTH - MARGIN, y - size - 3.5 * mm, "Scan for the full protocol")
        pdf.setFillGray(0)

    y -= 26 * mm
    pdf.setStrokeGray(0.8)
    pdf.setLineWidth(0.8)
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)

    y -= 9 * mm
    section_heading(pdf, "Every shot, every time", MARGIN, y, CONTENT_WIDTH)
    y -= 9 * mm
    for key, text in FIELD_SUMMARY:
        pdf.setFont("Helvetica-Bold", 8.5)
        pdf.setFillGray(0.15)
        pdf.drawString(MARGIN, y, key)
        pdf.setFont("Helvetica", 8.5)
        pdf.setFillGray(0.3)
        pdf.drawString(MARGIN + 24 * mm, y, text)
        y -= 5.6 * mm
    pdf.setFillGray(0)

    y -= 5 * mm
    section_heading(pdf, "Before you leave the site - check all six", MARGIN, y, CONTENT_WIDTH)
    y -= 9 * mm
    for item in [
        "Sharp: individual particles resolvable at 100% zoom",
        "Evenly lit: no hard shadow, no blown-white patch, no dark corner",
        "Fills the frame: soil dominant, no sky, no horizon, no hands or shoes",
        "No glare: no specular white hotspot",
        "Colour true: screen matches the soil in front of you",
        "Not too dark: Night mode never engaged",
    ]:
        pdf.setStrokeGray(0.35)
        pdf.setLineWidth(0.8)
        pdf.rect(MARGIN, y - 0.8 * mm, 3.4 * mm, 3.4 * mm, stroke=1, fill=0)
        pdf.setFont("Helvetica", 8.5)
        pdf.setFillGray(0.3)
        pdf.drawString(MARGIN + 6 * mm, y, item)
        y -= 6 * mm
    pdf.setFillGray(0)

    y -= 5 * mm
    section_heading(pdf, "Progress tracker", MARGIN, y, CONTENT_WIDTH)
    y -= 10 * mm
    columns = 5
    column_width = CONTENT_WIDTH / columns
    for index, sample_id in enumerate(sample_ids):
        column = index % columns
        row = index // columns
        box_x = MARGIN + column * column_width
        box_y = y - row * 7 * mm
        pdf.setStrokeGray(0.35)
        pdf.setLineWidth(0.8)
        pdf.rect(box_x, box_y - 0.8 * mm, 3.4 * mm, 3.4 * mm, stroke=1, fill=0)
        pdf.setFont("Helvetica", 8)
        pdf.setFillGray(0.3)
        pdf.drawString(box_x + 5.5 * mm, box_y, sample_id)
    pdf.setFillGray(0)

    pdf.setFont("Helvetica", 6.5)
    pdf.setFillGray(0.55)
    pdf.drawString(MARGIN, MARGIN - 4 * mm, url)
    pdf.setFillGray(0)
    pdf.showPage()


def draw_sample_page(pdf, sample_id: str, index: int, total: int, qr_image, url: str) -> None:
    y = PAGE_HEIGHT - MARGIN

    # --- header -----------------------------------------------------------
    pdf.setFillGray(0)
    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(MARGIN, y - 7 * mm, sample_id)
    pdf.setFont("Helvetica", 9)
    pdf.setFillGray(0.45)
    pdf.drawString(MARGIN, y - 13 * mm, f"SAWA Phase 1A field checklist - sample {index} of {total}")
    pdf.setFillGray(0)

    if qr_image:
        size = 20 * mm
        pdf.drawImage(ImageReader(qr_image), PAGE_WIDTH - MARGIN - size, y - size,
                      size, size, preserveAspectRatio=True, mask="auto")
        pdf.setFillGray(0.5)
        pdf.setFont("Helvetica", 5.5)
        pdf.drawRightString(PAGE_WIDTH - MARGIN, y - size - 3 * mm, "Scan: capture protocol")
        pdf.setFillGray(0)

    y -= 24 * mm
    pdf.setStrokeGray(0.8)
    pdf.setLineWidth(0.8)
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)

    half = (CONTENT_WIDTH - 8 * mm) / 2
    right_x = MARGIN + half + 8 * mm

    # --- when & where -----------------------------------------------------
    y -= 8 * mm
    section_heading(pdf, "When & where", MARGIN, y, CONTENT_WIDTH)
    y -= 8 * mm
    label_and_line(pdf, "Date (YYYY-MM-DD)", MARGIN, y, half)
    label_and_line(pdf, "Time (HH:MM)", right_x, y, half, "24-hour")
    y -= FIELD_GAP
    label_and_line(pdf, "Location (village / locality)", MARGIN, y, half)
    label_and_line(pdf, "District", right_x, y, half)
    y -= FIELD_GAP
    label_and_line(pdf, "GPS latitude", MARGIN, y, half, "only if photo has no GPS")
    label_and_line(pdf, "GPS longitude", right_x, y, half, "Maps app -> drop pin")

    # --- the sample -------------------------------------------------------
    y -= FIELD_GAP + 4 * mm
    section_heading(pdf, "The sample", MARGIN, y, CONTENT_WIDTH)
    y -= 8 * mm
    label_and_line(pdf, "Depth dug (cm)", MARGIN, y, half, "actual, not planned")
    label_and_line(pdf, "Capture distance (cm)", right_x, y, half, "target 15")
    y -= FIELD_GAP + 2 * mm
    checkbox_row(pdf, "Weather", ["Sunny", "Cloudy", "Overcast", "Drizzle"], MARGIN, y)
    y -= FIELD_GAP + 2 * mm
    checkbox_row(pdf, "Soil moisture (visual)", ["Dry", "Moist", "Wet"], MARGIN, y)
    pdf.setFillGray(0.55)
    pdf.setFont("Helvetica-Oblique", 6.5)
    pdf.drawString(MARGIN, y - 11.5 * mm,
                   "Dry: pale, dusty, crumbles.   Moist: darker, holds a ball, damp palm.   "
                   "Wet: glistening, free water, sticky.")
    pdf.setFillGray(0)
    # Extra room here: the moisture hint above hangs 11.5mm below its row, so a
    # plain FIELD_GAP would leave it touching the debris label.
    y -= FIELD_GAP + 9 * mm
    checkbox_row(pdf, "Visible debris (stones, roots, plastic)", ["Yes", "No"], MARGIN, y)

    # --- the photos -------------------------------------------------------
    y -= FIELD_GAP + 6 * mm
    section_heading(pdf, "The photos", MARGIN, y, CONTENT_WIDTH)
    y -= 8 * mm
    checkbox_row(pdf, "Photos taken", ["Yes", "No"], MARGIN, y)
    label_and_line(pdf, "How many", right_x, y, half, "aim for 3")
    y -= FIELD_GAP + 4 * mm

    pdf.setFillGray(0.25)
    pdf.setFont("Helvetica", LABEL_SIZE)
    pdf.drawString(MARGIN, y, "Quality check - tick each one you verified at 100% zoom")
    pdf.setFillGray(0)
    y -= 6.5 * mm
    quality_items = [
        "Sharp", "Evenly lit", "Fills frame",
        "No glare", "Colour true", "Not too dark",
    ]
    box = 3.4 * mm
    for position, item in enumerate(quality_items):
        column = position % 3
        row = position // 3
        item_x = MARGIN + column * (CONTENT_WIDTH / 3)
        item_y = y - row * 6.5 * mm
        pdf.setStrokeGray(0.35)
        pdf.setLineWidth(0.8)
        pdf.rect(item_x, item_y - 0.8 * mm, box, box, stroke=1, fill=0)
        pdf.setFont("Helvetica", 8.5)
        pdf.setFillGray(0.3)
        pdf.drawString(item_x + 5.5 * mm, item_y, item)
    pdf.setFillGray(0)
    y -= 13 * mm
    label_and_line(pdf, "Quality score (0-10)", MARGIN, y, half, "9-10 all clean, <5 reshoot")

    # --- notes ------------------------------------------------------------
    y -= FIELD_GAP + 4 * mm
    section_heading(pdf, "Notes", MARGIN, y, CONTENT_WIDTH)
    pdf.setFillGray(0.55)
    pdf.setFont("Helvetica-Oblique", 6.5)
    pdf.drawRightString(PAGE_WIDTH - MARGIN, y,
                        "crop grown, recent irrigation or fertiliser, unusual colour, delays")
    pdf.setFillGray(0)
    y -= 11 * mm
    for _ in range(3):
        write_line(pdf, MARGIN, y, CONTENT_WIDTH)
        y -= 10 * mm

    # --- footer -----------------------------------------------------------
    pdf.setFillGray(0.55)
    pdf.setFont("Helvetica", 6.5)
    pdf.drawString(MARGIN, MARGIN - 4 * mm,
                   "No flash | 1x zoom | 15 cm | 90 degrees | open shade | same white dish")
    pdf.drawRightString(PAGE_WIDTH - MARGIN, MARGIN - 4 * mm, f"{sample_id}   ({index}/{total})")
    pdf.setFillGray(0)
    pdf.showPage()


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help=f"Output PDF (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--count", type=int, default=20, help="Number of sample pages (default: 20)")
    parser.add_argument("--start", type=int, default=1, help="First sample number (default: 1)")
    parser.add_argument("--prefix", default="SAWA", help="Sample ID prefix (default: SAWA)")
    parser.add_argument("--url", default=PROTOCOL_URL, help="URL encoded in the QR code")
    parser.add_argument("--no-cover", action="store_true", help="Omit the quick-reference cover page")
    parser.add_argument("--quiet", action="store_true", help="Only report warnings and errors")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    if args.count < 1:
        LOG.error("--count must be at least 1")
        return 1
    if args.start < 1:
        LOG.error("--start must be at least 1")
        return 1

    sample_ids = [f"{args.prefix}-{number:03d}" for number in range(args.start, args.start + args.count)]
    qr_image = make_qr_image(args.url)

    try:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        pdf = pdf_canvas.Canvas(str(args.output), pagesize=A4)
        pdf.setTitle(f"SAWA Phase 1A field checklist - {sample_ids[0]} to {sample_ids[-1]}")
        pdf.setAuthor("SAWA")

        if not args.no_cover:
            draw_cover(pdf, qr_image, args.url, sample_ids)
        for index, sample_id in enumerate(sample_ids, start=1):
            draw_sample_page(pdf, sample_id, index, len(sample_ids), qr_image, args.url)

        pdf.save()
    except OSError as exc:
        LOG.error("Could not write %s: %s", args.output, exc)
        return 1

    pages = len(sample_ids) + (0 if args.no_cover else 1)
    LOG.warning(
        "Wrote %s - %d pages (%s ... %s)%s",
        args.output,
        pages,
        sample_ids[0],
        sample_ids[-1],
        "" if qr_image else ", no QR code",
    )
    # No %-args here, so logging does no interpolation: write a literal single '%'.
    LOG.warning("Print single-sided at 100% scale (no 'fit to page') so the tick boxes stay usable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
