# Phase 1A — Soil Photo Capture Protocol

**Goal:** 20 soil photographs + field metadata, captured on an iPhone 14, at ₹0 cost.
**Why it matters:** these images become the training set that replaces the current
heuristic nutrient prediction. Every uncontrolled variable at capture time —
lighting, distance, dish colour — becomes label noise the model cannot unlearn.
Consistency beats image quality.

Read this once end-to-end before your first collection day. Print
`data/phase-1a/CHECKLIST-20-SAMPLES.pdf` and carry it with you.

---

## 1. Equipment

| Item | Spec | Cost |
| --- | --- | --- |
| iPhone 14 | Main (wide) camera | owned |
| White dish | Flat, matte white, 15–20 cm across (melamine plate works) | owned |
| Ruler / measuring tape | Marked to at least 20 cm | owned |
| Trowel or khurpi | For digging to depth | owned |
| Zip bags or containers | 1 per sample, labelled SAWA-001 … SAWA-020 | ~₹0 |
| Printed checklist | 20 pages, from `generate-checklist-pdf.py` | print cost |

**Do not** buy a colour card, light tent, or macro lens for Phase 1A. Those are
Phase 1B/hardware-roadmap items. The point of this phase is to find out how far
uncalibrated phone photos get us.

---

## 2. iPhone 14 camera specifications

These are the numbers the capture distances below are derived from. iPhone 14
(non-Pro) figures:

| Property | Main (wide) camera | Ultra Wide |
| --- | --- | --- |
| Resolution | 12 MP (4032 × 3024) | 12 MP |
| Aperture | ƒ/1.5 | ƒ/2.4 |
| Focal length (35 mm equivalent) | 26 mm | 13 mm |
| Actual focal length | ≈ 5.7 mm | ≈ 1.5 mm |
| Sensor | 1/1.7", 1.9 µm pixels | 1/3.6" |
| Stabilisation | Sensor-shift OIS | none |
| Autofocus | Yes | **No** (fixed focus) |

### Macro mode: you do not have it

Dedicated Macro mode is a **Pro-model** feature — it works by switching to an
Ultra Wide camera that has autofocus. The iPhone 14's Ultra Wide is fixed-focus,
so there is no Macro mode and no macro switch will appear in the Camera app.

**Consequence:** the main camera's minimum focus distance is roughly **10–15 cm**.
At the 15 cm target distance you are near that limit. If the image will not lock
focus, back off to 20–25 cm rather than fighting it — see §8.

### Framing at 15 cm

At 15 cm from the subject, the 26 mm-equivalent main camera covers roughly
**21 cm × 14 cm** (landscape) of ground. A 15–20 cm dish therefore fills most of
the frame, which is exactly what the validation gate wants: a close-up,
fill-frame soil shot with no sky, no horizon, and no surrounding scenery.

**Always shoot at 1× zoom.** The 2× option on iPhone 14 is a digital crop of the
same sensor — it throws away real pixels and changes the effective sampling of
soil texture between samples. Keep it off for every shot.

---

## 3. Sample preparation

1. **Dig to depth.** Clear surface litter, then dig to the target depth
   (default 15 cm; record whatever you actually used). Take the soil from the
   *side wall* of the hole at that depth, not the loose spoil pile.
2. **Collect ~500 g** into a labelled bag or container. Write the sample ID
   (`SAWA-001`) on it immediately, in pen, before moving on.
3. **Remove coarse debris** — stones larger than ~5 mm, roots, leaves, insects,
   plastic. Do *not* sieve, crush, or dry the soil. We want field-moist soil in
   its natural aggregate state; drying changes colour dramatically and would
   make the photo unrepresentative of what a farmer would photograph.
4. **Pour into the white dish** and gently level with the back of the trowel or a
   straight edge. Aim for a flat layer roughly 1–2 cm deep that covers the dish
   floor completely — no dish bottom showing through.
5. **Do not compact or polish** the surface. A pressed, smoothed surface has a
   different specular sheen than natural soil and will bias texture features.
6. **Photograph within ~10 minutes of digging.** Soil surface colour lightens
   measurably as it dries. If there is any delay, note it in the `notes` field.

> **Same dish, every sample.** Whatever white dish you start with, use that
> exact dish for all 20. A different dish is a different white balance reference.

---

## 4. Lighting

Lighting is the single largest source of avoidable noise. The whole pipeline
keys off colour.

**Do:**
- Shoot in **open shade under a clear sky**, or under **light overcast**. Both
  give diffuse, roughly neutral light with no hard shadow edges.
- Shoot between roughly **10:00 and 15:00**, when the sun is high and colour
  temperature is closest to neutral daylight.
- Keep the dish **fully and evenly lit** — the whole surface in shade, or the
  whole surface in sun. Never half-and-half.
- Turn your body so your **own shadow does not fall on the dish**. The shadow of
  the phone is the usual culprit; watch the preview, not the soil.

**Do not:**
- **No flash. Ever.** Flash creates a hot centre, a dark falloff at the edges,
  and specular glare off moist particles. Confirm the flash icon shows a struck-
  through bolt before you start, not "Auto".
- **No direct midday sun on the dish.** Blown highlights destroy the exact
  colour information the model needs.
- **No shooting near golden hour** (roughly first and last hour of daylight).
  The light is strongly orange and will systematically shift every sample taken
  then.
- **No coloured surroundings.** A red wall, a blue tarp, or dense green canopy
  directly above will bounce a colour cast onto the soil. Move to open ground.
- **No Night mode.** If Night mode engages, there is not enough light — move,
  don't shoot.

---

## 5. Capture geometry

| Parameter | Target | Tolerance |
| --- | --- | --- |
| Distance (lens to soil surface) | **15 cm** | ±2 cm |
| Angle | **90° perpendicular**, straight down | ±5° |
| Zoom | **1×** | exact — never 2× |
| Orientation | Landscape | consistent across all 20 |

**Measuring distance:** lay the ruler upright beside the dish with the 0 mark at
the soil surface. Bring the phone down until the *lens*, not the screen edge, is
level with the 15 cm mark. Do this for the first few samples until you can judge
15 cm reliably by eye; spot-check with the ruler every few samples.

**Getting 90° right:** open the Camera app's built-in level.
`Settings → Camera → Grid` (on) also enables the level overlay for downward
shots. When the phone is level, two crosshairs merge and turn yellow. Shoot only
when they are merged.

**Steps per shot:**
1. Frame so the dish rim sits just inside the frame edges — soil filling the
   frame, minimal background.
2. **Tap the centre of the soil** to set focus and exposure there.
3. **Check the exposure slider** (the small sun beside the focus box) sits at 0.
   Drag it back to centre if a previous shot left it offset.
4. Hold steady, breathe out, tap the shutter. OIS handles the rest.
5. **Take 3 shots per sample.** Storage is free; a return trip is not. Keep the
   sharpest one as `SAWA-0NN.jpg`, discard the rest.

---

## 6. Metadata to capture

Two sources, merged later by `populate-manifest-csv.py`.

**Automatic — from the photo's EXIF** (nothing to do but leave it enabled):
- GPS latitude / longitude
- Date and time of capture
- Camera model, focal length, ISO, shutter speed

> **Enable Location before you leave home:**
> `Settings → Privacy & Security → Location Services → Camera → While Using the App`,
> and switch **Precise Location** on. Without this, every photo lands with no
> GPS and the coordinates must be filled by hand.

**Manual — onto the printed checklist, one page per sample:**

| Field | How to record |
| --- | --- |
| Sample ID | Pre-printed (`SAWA-001` … `SAWA-020`) |
| Location | Village / locality name |
| District | e.g. Prayagraj |
| Depth (cm) | Actual depth dug, not the plan |
| Weather | Sunny / Cloudy / Overcast / Drizzle |
| Soil moisture (visual) | Dry / Moist / Wet — see the scale below |
| Visible debris | Yes / No |
| Photos taken | Count |
| Notes | Anything unusual: crop grown, recent irrigation, fertiliser, odd colour |

### Moisture scale (use these three, consistently)

- **Dry** — pale, dusty, falls apart when squeezed, leaves no mark on the palm.
- **Moist** — darker than dry soil, holds together when squeezed into a ball,
  leaves a damp mark on the palm but no free water.
- **Wet** — glistening, free water visible when pressed, ball is sticky and
  smears rather than crumbling.

Moisture strongly darkens soil colour. Recording it consistently is what lets
the model separate "dark because organic-rich" from "dark because wet."

### GPS is sensitive

The manifest will contain precise coordinates of specific fields, some of them
other people's land. Treat it accordingly — see the privacy note in
[data/phase-1a/README.md](../data/phase-1a/README.md).

---

## 7. Quality checklist — verify before leaving the site

Zoom into the photo on the phone (pinch to ~100%) and confirm all six. It costs
20 seconds; re-collecting a sample costs a trip.

- [ ] **Sharp.** Individual soil particles are resolvable at 100% zoom. Any
      double edges or smearing means motion blur — reshoot.
- [ ] **Evenly lit.** No hard shadow crossing the dish, no blown-white patch,
      no dark corner.
- [ ] **Fill-frame soil.** Soil dominates. No sky, no horizon, no shoes, no
      hands, minimal dish rim, no background scenery.
- [ ] **No glare.** No white specular hotspot from sun or a reflective surface.
- [ ] **Colour looks true.** Compare the screen to the actual soil in front of
      you. If the photo looks noticeably more orange, blue, or washed out than
      reality, the lighting is wrong — move and reshoot.
- [ ] **Not too dark.** Check ISO after transfer: **ISO ≤ 400 is good, ISO > 800
      means the shot was underlit** and is noisy enough to matter.

Score the sample 0–10 on the checklist (`quality_score`). Rough guide: 9–10 all
six pass cleanly; 7–8 all pass but one is marginal; 5–6 one clear failure you
chose to keep; below 5 reshoot. Being honest here is what lets you later ask
"do the low-quality images hurt the model?" instead of guessing.

---

## 8. Troubleshooting

**Focus won't lock / image is soft at 15 cm.**
You are at the main camera's minimum focus distance and there is no Macro mode
to fall back on. In order: (a) tap-to-focus directly on a textured clump rather
than a flat smooth patch — the autofocus needs contrast; (b) back off to 20 cm,
where focus is comfortable, and record `capture_distance_cm = 20` — an honestly
recorded 20 cm is far better than a mislabelled soft 15 cm; (c) if you must have
15 cm framing, shoot at 20–25 cm and crop in post, never with digital zoom.

**Image too dark / Night mode keeps engaging.**
There is not enough light. Move to a brighter open-shade spot. Do **not** raise
the exposure slider to compensate — that changes the tone curve relative to
every other sample. Do not use flash. If it is genuinely too dark (heavy
overcast, late evening), bag the sample, note the ID, and photograph it the next
day in better light — record the delay in `notes`.

**Photo looks blown out / white patches.**
Direct sun. Move into open shade. If you cannot, shade the dish with your body
so the *entire* dish is shaded, and re-check that the shadow edge isn't crossing
the frame.

**No GPS in the photo.**
Location Services was off for Camera, or you are indoors / under heavy cover.
Fix the setting (§6), then open Apple Maps, drop a pin on your location, and
copy the coordinates onto the checklist by hand. `populate-manifest-csv.py`
accepts `gps_lat` / `gps_lon` columns in the checklist CSV and will use them when
EXIF has none.

**Photos are HEIC, not JPEG.**
That is the iPhone default and it is fine — the extractor handles HEIC via
`pillow-heif`. If you would rather have JPEGs at source, set
`Settings → Camera → Formats → Most Compatible`. Either way, **never transfer
photos over WhatsApp, Telegram, or any messenger** — they re-compress the image
and strip EXIF, destroying both the texture detail and the GPS. Use a cable, AirDrop,
or iCloud Photos "Download Originals".

**Soil dried out before I could shoot it.**
Note it and continue — but flag it in `notes`. Dried-out soil photographs
lighter than the field condition its lab values will describe, which is exactly
the kind of mismatch worth being able to filter on later.

**Wrong sample ID written on the bag.**
Do not erase and reuse. Note the correction in the `notes` field of both
affected checklist pages so the trail stays auditable.

---

## 9. After collection — the data path

Full command-by-command instructions live in
[data/phase-1a/README.md](../data/phase-1a/README.md). In short:

1. Transfer originals to `data/phase-1a/raw/`, renamed `SAWA-001.jpg` … `SAWA-020.jpg`.
2. Type your checklist pages into `data/phase-1a/checklist-responses.csv`.
3. `python scripts/extract-iphone-metadata.py` — writes one JSON per image.
4. `python scripts/populate-manifest-csv.py` — merges EXIF + checklist into `manifest.csv`.
5. Lab columns stay empty until Phase 1B, when soil test results come back.

---

## 10. One-page field summary

Copy this onto the back of the printed checklist.

```
DISTANCE   15 cm (±2)      — ruler-checked, lens to soil
ANGLE      90° straight down — level crosshairs merged, yellow
ZOOM       1x  — never 2x
FLASH      OFF — always
LIGHT      Open shade or light overcast, 10:00–15:00
           No direct sun, no golden hour, no own shadow
DISH       Same white dish every time, soil leveled, no dish showing
SAMPLE     ~500 g, from side wall at depth, debris removed, not dried
SHOTS      3 per sample, tap centre to focus, exposure slider at 0
CHECK      Sharp / even light / fills frame / no glare / true colour / not dark
RECORD     ID, location, district, depth, weather, moisture, debris, notes
GPS        Location Services ON for Camera + Precise Location
TRANSFER   Cable, AirDrop, or iCloud originals — NEVER WhatsApp
```
