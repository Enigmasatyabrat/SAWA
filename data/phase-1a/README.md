# Phase 1A — Photo Collection

**Target:** 20 soil photographs with field metadata, this month, at ₹0 cost.
**Equipment:** an iPhone 14, a white dish, a ruler, and a printed checklist.

Phase 1A collects **images + field observations only**. Lab values (N, P, K, pH,
EC, organic carbon) arrive in **Phase 1B**, when the bagged samples go to a soil
testing lab. Every manifest column ending in `_later` stays empty until then —
that is by design, not an incomplete file.

The capture rules live in
[docs/PHASE-1A-CAPTURE-PROTOCOL.md](../../docs/PHASE-1A-CAPTURE-PROTOCOL.md).
Read that before your first collection day. This file covers what to do with the
photos afterwards.

> **Relationship to `data/samples/`:** that directory holds the older, simpler
> manifest aimed at 50–100 samples for model training. `data/phase-1a/` is the
> structured 20-sample pilot that feeds it — richer metadata, auditable
> provenance, lab values pending. Keep them separate; do not merge the schemas.

---

## Contents

```
data/phase-1a/
├── README.md                   this file
├── manifest.csv                the tracked source of truth (schema below)
├── CHECKLIST-20-SAMPLES.pdf    generated — print this, use it in the field
├── checklist-responses.csv     you type your filled-in checklist pages here
└── raw/                        photos + generated EXIF JSON
    ├── SAWA-001.jpg
    ├── SAWA-001.json
    └── ...

scripts/
├── extract-iphone-metadata.py  photos  -> one JSON per image
├── populate-manifest-csv.py    JSON + checklist -> manifest.csv
├── generate-checklist-pdf.py   -> CHECKLIST-20-SAMPLES.pdf
└── requirements-phase-1a.txt
```

---

## One-time setup

```bash
pip install -r scripts/requirements-phase-1a.txt
```

Then generate and print the field checklist:

```bash
python scripts/generate-checklist-pdf.py
```

That writes `data/phase-1a/CHECKLIST-20-SAMPLES.pdf` — a quick-reference cover
page plus 20 numbered sample pages. **Print single-sided at 100% scale** (turn
off "fit to page", or the tick boxes shrink). Clip it to a board and take a pen.

Useful variants:

```bash
python scripts/generate-checklist-pdf.py --count 40 --start 21   # a second batch
python scripts/generate-checklist-pdf.py --no-cover              # sample pages only
```

---

## Collection day

Follow [the capture protocol](../../docs/PHASE-1A-CAPTURE-PROTOCOL.md). The
short version:

1. Enable `Settings → Privacy & Security → Location Services → Camera →
   While Using the App`, with **Precise Location** on. Without this there is no
   GPS in the photos and you will be typing coordinates by hand.
2. Dig to depth, bag ~500 g, label it `SAWA-0NN` in pen.
3. Level the soil in the **same white dish** every time.
4. Shoot straight down from **15 cm**, at **1× zoom**, **no flash**, in open
   shade. Three shots per sample.
5. Fill in the checklist page for that sample before moving on.

---

## After collection — the four steps

### Step 1 — transfer the photos

Copy the originals into `data/phase-1a/raw/` and rename them to match the sample
IDs: `SAWA-001.jpg`, `SAWA-002.jpg`, … The stem must equal the `sample_id`
exactly — that filename is how every later step finds the image.

**Transfer by cable, AirDrop, or iCloud Photos "Download Originals" only.**
WhatsApp, Telegram, and most chat apps re-compress the image and strip EXIF,
which destroys both the fine texture and the GPS. A photo that arrives via a
messenger is not recoverable — it has to be reshot.

HEIC files are fine; keep the `.heic` extension and the scripts handle them.

### Step 2 — extract the EXIF

```bash
python scripts/extract-iphone-metadata.py
```

Writes `SAWA-001.json` beside each image, containing GPS, capture timestamp,
camera model, focal length, ISO, shutter speed, file size, and a SHA-256 hash.

The script never crashes on a bad photo — it warns and moves on. Read the
warnings; they are the point:

| Warning | What it means |
| --- | --- |
| `no GPS data` | Location Services was off. Fill `gps_lat`/`gps_lon` in the checklist CSV by hand. |
| `no capture timestamp` | Falls back to file modification time — verify it before trusting the date. |
| `shot at ISO … (>800)` | Underlit and noisy. Consider a reshoot. |
| `has no EXIF block at all` | The file was re-saved or sent through a messenger. Re-transfer the original. |
| `HEIC but pillow-heif is not installed` | `pip install pillow-heif`, then re-run. |

Options: `--input-dir`, `--output-dir`, `--skip-existing`, `--quiet`.

### Step 3 — type in your checklist pages

Open `checklist-responses.csv` and add one row per sample. `#` lines are
comments; leave them or delete them, the script ignores both.

```csv
sample_id,location,district,depth_cm,weather,moisture_visual,capture_distance_cm,quality_score,gps_lat,gps_lon,notes
SAWA-001,Teliyarganj,Prayagraj,15,Sunny,Moist,15,9.5,,,"Fresh loam, dense organic matter"
SAWA-002,Chaka,Prayagraj,20,Cloudy,Dry,15,8,,,"Rocky soil, sparse vegetation"
```

- **Required:** `sample_id`, `location`, `district`, `depth_cm`, `weather`,
  `moisture_visual`.
- **`weather`** must be one of `Sunny`, `Cloudy`, `Overcast`, `Drizzle`.
- **`moisture_visual`** must be one of `Dry`, `Moist`, `Wet`.
- **`capture_distance_cm`** defaults to `15` if left blank.
- **`gps_lat` / `gps_lon`** only needed when the photo has no EXIF GPS. When
  present they **override** EXIF — so leave them blank unless you mean it.
- **`notes`** must be quoted if it contains a comma.

### Step 4 — build the manifest

```bash
python scripts/populate-manifest-csv.py --dry-run   # preview to stdout
python scripts/populate-manifest-csv.py            # write manifest.csv
```

This merges each checklist row with its `SAWA-0NN.json`, sorts by `sample_id`,
and overwrites `manifest.csv`. It is safe to re-run: **fix
`checklist-responses.csv` and re-run rather than hand-editing manifest rows**,
or the next run will silently discard your edit.

It warns about anything that would quietly produce a bad dataset: missing JSON,
duplicate sample IDs, out-of-vocabulary weather or moisture values, non-numeric
depths, images in `raw/` that no checklist row accounts for, and timestamps that
came from file mtime rather than EXIF.

Options: `--manifest`, `--checklist`, `--raw-dir`, `--output`, `--dry-run`,
`--quiet`.

---

## Schema legend — `manifest.csv`

Filled during Phase 1A collection:

| Column | Source | Notes |
| --- | --- | --- |
| `sample_id` | checklist | `SAWA-001` … `SAWA-020`. The join key for everything. |
| `date_collected` | EXIF | `YYYY-MM-DD`, from `DateTimeOriginal`. |
| `time_collected` | EXIF | `HH:MM:SS`, 24-hour, local time on the phone. |
| `location` | checklist | Village or locality name. |
| `district` | checklist | e.g. `Prayagraj`. |
| `gps_lat` | EXIF, or checklist override | Signed decimal degrees, 6 dp. |
| `gps_lon` | EXIF, or checklist override | Signed decimal degrees, 6 dp. |
| `depth_cm` | checklist | Depth actually dug, not the plan. |
| `weather` | checklist | `Sunny` / `Cloudy` / `Overcast` / `Drizzle`. |
| `moisture_visual` | checklist | `Dry` / `Moist` / `Wet` — see the protocol's scale. |
| `phone_model` | EXIF | e.g. `iPhone 14`. Recorded so a future phone change is detectable. |
| `capture_distance_cm` | checklist | Target 15; record the real value if you backed off. |
| `image_filename` | disk | Filename inside `raw/`, e.g. `SAWA-001.jpg`. |
| `image_hash_sha256` | computed | SHA-256 of the image bytes. Ties the row to one exact file — if the image is ever re-saved or re-compressed, the hash stops matching and you know. |
| `quality_score` | checklist | 0–10, your judgement against the six-point quality check. |
| `notes` | checklist | Free text. Quote if it contains a comma. |

Empty until Phase 1B:

| Column | Meaning |
| --- | --- |
| `lab_id_later` | The lab's own reference number for the sample |
| `nutrient_n_ppm_later` | Available nitrogen, ppm |
| `nutrient_p_ppm_later` | Available phosphorus, ppm |
| `nutrient_k_ppm_later` | Available potassium, ppm |
| `ph_later` | pH, typically 5.0–8.0 |
| `ec_later` | Electrical conductivity, dS/m |
| `oc_percent_later` | Organic carbon, % |

**Never estimate a lab value.** A guessed number teaches the model the
heuristic's guesses instead of ground truth, which is the exact failure Phase 1
exists to fix. Leave it blank.

Lines beginning with `#` are comments and must be stripped before parsing —
same convention as `data/samples/manifest.csv`.

---

## Quality checklist — what makes a good soil photo

Verify all six on the phone, at 100% zoom, **before leaving the site**:

1. **Sharp** — individual soil particles resolvable, no double edges.
2. **Evenly lit** — no hard shadow crossing the dish, no blown-white patch, no
   dark corner.
3. **Fills the frame** — soil dominant; no sky, no horizon, no hands or shoes,
   minimal dish rim. The validation gate rejects landscapes.
4. **No glare** — no specular white hotspot.
5. **Colour true** — the screen matches the soil in front of you.
6. **Not too dark** — Night mode never engaged; ISO ≤ 400 good, > 800 too noisy.

Score 0–10 and be honest about it. An accurate `quality_score` lets you later
ask "do the poor images actually hurt the model?" instead of guessing.

---

## Troubleshooting

**Focus won't lock at 15 cm.** The iPhone 14 has no Macro mode (that is a Pro
feature) and its minimum focus distance is around 10–15 cm, so you are at the
limit. Tap-to-focus on a textured clump rather than a flat patch; if it still
fails, back off to 20 cm and record `capture_distance_cm = 20`. An honestly
recorded 20 cm beats a mislabelled soft 15 cm. Never use digital zoom to close
the gap.

**No GPS in any photo.** Location Services is off for Camera. Fix it, then for
the already-taken photos open Apple Maps, drop a pin at the site, and put the
coordinates in the `gps_lat`/`gps_lon` columns of `checklist-responses.csv` —
the populate script uses them when EXIF has none.

**`no such file: SAWA-003.json`.** Either the image is named something else (the
stem must exactly equal the `sample_id`) or you have not run
`extract-iphone-metadata.py` yet.

**`... is in raw/ but has no checklist row`.** You transferred a photo you never
typed a checklist row for. Add the row, or the sample never reaches the manifest.

**Blurry, dark, or blown-out photos.** These are capture-time problems with
capture-time fixes — see §8 of
[the capture protocol](../../docs/PHASE-1A-CAPTURE-PROTOCOL.md).

**HEIC files produce empty EXIF.** `pip install pillow-heif`, then re-run the
extractor.

---

## Privacy — read before sharing anything

`manifest.csv` contains **precise GPS coordinates of specific fields**, some of
them other people's land. Treat it as sensitive:

- Do not post the manifest publicly, attach it to an issue, or paste it into a
  chat with anyone outside the project.
- Before sharing outside the team, **truncate coordinates to 2 decimal places**
  (~1 km precision) or drop the `gps_lat`/`gps_lon` columns entirely.
- If you collected on land you do not own, get the owner's agreement before the
  location is recorded anywhere beyond the team.
- The photos themselves also carry GPS in their EXIF — the same care applies to
  the raw images.

---

## What isn't committed

`.gitignore` excludes `data/phase-1a/raw/*` (images and the generated JSON).
The photos are large and would bloat the repository, and the JSON is
reproducible from them in one command. `manifest.csv` is the tracked source of
truth and references each image by filename and SHA-256 hash.

**Back the raw photos up somewhere outside this repo** — an external drive or a
private cloud folder. They cannot be regenerated, and the manifest is worthless
without them.
