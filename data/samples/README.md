# Phase 1 — Soil Sample Collection

Labelled soil data for training the Phase 2 model that will replace the current
heuristic nutrient prediction.

## Schema (`manifest.csv`)

| Column | Type | Notes |
| --- | --- | --- |
| `image_path` | string | Path relative to `data/`, e.g. `samples/soil_001.jpg` |
| `lab_ph` | number | Lab-measured pH (typically 5.0–8.0) |
| `lab_nitrogen` | number | Lab-measured N, ppm |
| `lab_phosphorus` | number | Lab-measured P, ppm |
| `lab_potassium` | number | Lab-measured K, ppm |
| `soil_type` | string | One of: Sandy Soil, Loamy Soil, Clay Soil, Silty Soil, Mixed Soil |
| `location` | string | Where the sample was taken |
| `date` | ISO date | `YYYY-MM-DD` collection date |
| `notes` | string | Free text; avoid commas or quote the field |

Lines beginning with `#` are comments and must be stripped before parsing.

## Collection guidelines

- Photograph the soil as a **close-up fill-frame shot** — the validation gate
  rejects landscapes, sky, and images that aren't dominantly soil.
- Use consistent, diffuse daylight. Avoid harsh shadow, flash glare, and colour
  casts; the whole pipeline keys off colour, so lighting bias becomes label noise.
- One photo per physical sample, taken at the same time the lab sample is bagged.
- Record lab values only from an actual soil test — never estimate them, or the
  model will learn the heuristic's guesses rather than ground truth.
- Target 50–100 samples before attempting training.

## Why the images aren't committed

`.gitignore` excludes `data/samples/*.jpg|jpeg|png`. The photos are large and
would bloat the repository; `manifest.csv` is the tracked source of truth and
references them by path. Keep the images backed up separately.
