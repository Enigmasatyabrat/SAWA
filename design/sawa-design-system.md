# SAWA design spec

Companion to [`sawa-prototype.html`](sawa-prototype.html), the clickable prototype. Open it over HTTP (for example `python -m http.server 5178 --directory design`), not from a `file:` or `data:` URL. Use the bar at the top to jump to any screen, switch viewport (360 / 390 / 768 / desktop), theme (light / dark / sunlight), backend (online / offline) and the simulated gate outcome.

The sample numbers in the prototype come from the real formulas in `src/lib/soil-engine.ts` and the six checks in `src/lib/image-validation.ts`. The random variation is left out so the numbers are repeatable.

---

## 1. Information architecture

```
SAWA
├── Home                     /
├── Analyze flow
│   ├── Add photo            /analyze      (idle · drag-over · preview · error ×3)
│   ├── Photo check          /check        (running, 6 checks, visible progress)
│   ├── Gate outcome         /gate/rejected · /gate/uncertain · /gate/passed (High | Medium)
│   └── Result               /result       (crops matched | no crop matches)
├── History                  /history      (list · empty · offline)
│   └── History detail       /history/:id  (mobile: detail only · desktop: list + detail)
├── About / Method           /method
├── Roadmap                  /roadmap      (read-only)
└── Design system            /system       (prototype only)
```

**Navigation**
- Mobile (<900px): sticky top bar (brand, connection status, display mode) and a bottom tab bar: Home · Analyze · History · About. The Roadmap is linked from About and the footer.
- Desktop (≥900px): top nav with Analyze · History · Method · Roadmap. Result and History use two columns.

**Primary flow**

```
Home ─ Analyze my soil ─▶ Add photo ─ Run photo check ─▶ Photo check (progress)
     └ Try a sample ─────────────────────────────────────▶ Photo check
Photo check ─▶ Rejected  ─ Take another photo ─▶ Add photo     (no results shown)
            ─▶ Uncertain ─ Retake photo ───────▶ Add photo     (no results shown)
            ─▶ Passed (High / Medium) ─ See soil results ─▶ Result ─▶ saved to History
```

The gate is step 2 of a visible 3-step stepper (Photo → Photo check → Results). When the gate stops, step 2 turns red with an ✕, so the stop is visible rather than a silent failure.

## 2. Screen list

| # | Screen | States designed | One primary action |
|---|---|---|---|
| 1 | Home | online, offline | Analyze my soil |
| 2 | Add photo | idle, drag-over, preview, unsupported type, too large, unreadable, offline | Run photo check (disabled until a photo is added) |
| 3 | Photo check | running (waiting → checking → OK/Weak/Fail per row), complete | none (Cancel is secondary) |
| 4 | Gate: Rejected | reason, recommendation, evidence list, "no results" note | Take another photo |
| 5 | Gate: Uncertain | confidence below 70%, reason, recommendation, evidence | Retake photo |
| 6 | Gate: Passed | High (≥90%) or Medium (70–89%, extra caution banner), evidence | See soil results |
| 7 | Result | crops matched; no crop matches; medium-confidence caution; saved to server; saved on device only | Analyze another photo |
| 8 | History list | populated, empty, offline (cached copy) | Analyze my soil (empty state only) |
| 9 | History detail | mobile detail with back link; desktop list + detail | Analyze another photo |
| 10 | About / Method | static | none |
| 11 | Roadmap | Shipped and Planned lists | none |

**Online vs offline**

| | Online | Offline / backend unavailable |
|---|---|---|
| Header pill | "Online" (wifi icon, green) | "Offline" (wifi-off icon, amber) |
| Analysis | `POST /api/analyze-soil` | TypeScript port runs in the browser. Same algorithm. |
| Save | Server (MongoDB, in-memory fallback) | This browser only. Marked "On this device only". |
| History | `GET /api/soil-analyses` | Browser copy, with a banner and a "Try connecting again" button |
| Detail | `GET /api/soil-analysis/{id}` | Browser copy |

## 3. Components and states

| Component | States | Notes |
|---|---|---|
| **Button** | primary, secondary, ghost; default, hover, focus, disabled, loading | Minimum 52px tall (44px for the small size). One primary per screen. A disabled button has a visible hint explaining why. |
| **Icon button** | default, hover, focus | 44 × 44. Used for display mode. |
| **Upload zone** | idle, drag-over, preview, error | Desktop says "Drag a soil photo here". Mobile says "Add a photo of your soil". Two buttons: Take photo (`capture="environment"`) and Choose file. The format line "JPEG or PNG · up to 10 MB" is always visible. |
| **Stepper** | not started, current, done (✓), stopped (✕, red) | `aria-current="step"` plus screen-reader status text. |
| **Check row** | waiting, checking (spinner), OK, Weak, Fail | Icon + text tag + one-line evidence. Never colour alone. |
| **Progress bar** | 0–6 of 6 | `role="progressbar"` with a live text label ("Checking exposure · 2 of 6"). |
| **Confidence badge** | High · n%, Medium · n%, Uncertain · n%, Rejected, Estimate confidence: Low | Each has its own icon: ✓ circle, half circle, ?, ✕, ⚠. |
| **Confidence meter** | fill to n% with tick marks at 70 and 90 | A legend states what the marks mean. Always paired with "What this confidence means". |
| **Palette swatch row** | normal, small share (<5%) | Swatch, "Colour n", RGB, hex, share bar, %. A stacked proportion bar sits above the rows. |
| **Soil-type card** | normal, close to a boundary (margin <10) | "Why this classification" disclosure: average colour, R/G/B tracks with rule ticks, rule table (Match / No / Not checked), closest-boundary sentence. |
| **Nutrient band** | Low, Medium, High (pH: Acidic, Neutral, Alkaline) | The band is primary: 3 segments, the active one filled, with ✓, bold text and a heading with an ↓ – ↑ icon. The number is secondary ("Score ≈ 65 (unitless, 10–150)"). Every card carries the disclaimer. |
| **Crop card / crop chip** | matched chip (✓); miss chip (✕, only used to explain empty states); neutral | Shows the crop name, its pH range, and N/P/K/pH chips. Never ranked: "shown in list order". |
| **Empty state** | no crop matches, history empty | Dashed border, icon, title, plain explanation, next step. |
| **Callout** | info (disclaimer), warn (offline, medium confidence), bad (file error), ok (guidance) | Icon + text. Errors use `role="alert"`, offline uses `role="status"`. |
| **History card** | default, hover, selected (desktop), no crop matches, on this device only | Thumbnail, soil type, date/time, top 3 crops + "n more", device marker. |
| **Disclosure** | closed, open | Native `<details>`. 52px summary row. Rotating chevron. |
| **Connection pill** | Online, Offline | Includes an `aria-label` with the full meaning. |

## 4. Design tokens

### Colour

| Token | Light | Dark | Sunlight | Use |
|---|---|---|---|---|
| `bg` | `#F6F1E7` | `#14110D` | `#FFFFFF` | Page |
| `surface` | `#FFFFFF` | `#1E1A15` | `#FFFFFF` | Cards |
| `surface-2` | `#EDE5D6` | `#29231C` | `#F0F0F0` | Inactive segments |
| `surface-3` | `#E0D4BF` | `#3A3127` | `#DADADA` | Tracks, disabled |
| `ink` | `#1E1912` | `#F4EEE4` | `#000000` | Text |
| `ink-2` | `#463C31` | `#D6CBB9` | `#111111` | Secondary text |
| `ink-3` | `#62574A` | `#B3A693` | `#262626` | Labels |
| `line` | `#D6CAB5` | `#3B3229` | `#000000` | Borders |
| `line-strong` | `#8F806A` | `#7A6B59` | `#000000` | Upload zone, secondary buttons |
| `primary` | `#2E5A36` | `#9BD3A5` | `#0F3D19` | Primary actions, links |
| `on-primary` | `#FFFFFF` | `#0E1A10` | `#FFFFFF` | Text on primary |
| `primary-soft` | `#E0EAD9` | `#22311F` | `#E3EFE3` | Selected nav, highlights |
| `soil` | `#6E4325` | `#B9825A` | `#4A2A12` | Brand mark |
| `ok` / `ok-bg` | `#2A6533` / `#E2EFDF` | `#9BD3A5` / `#1C2B1D` | `#0B4515` / `#FFF` | Pass, matched |
| `warn` / `warn-bg` | `#7A4E00` / `#FBEFD2` | `#F2C46B` / `#30240E` | `#4F3200` / `#FFF` | Weak, medium, offline |
| `bad` / `bad-bg` | `#9B2A1C` / `#F8E3DE` | `#F4A493` / `#371A15` | `#700F05` / `#FFF` | Fail, rejected, file errors |
| `info` / `info-bg` | `#1F4A72` / `#E4EDF6` | `#9CC3EC` / `#152433` | `#082E50` / `#FFF` | Disclaimer |
| `lvl-low` / `lvl-med` / `lvl-high` | `#8F3F17` / `#6B5A0E` / `#2E5A36` | `#F0A27A` / `#E2CF6E` / `#9BD3A5` | `#6E2A08` / `#4A3D00` / `#0F3D19` | Nutrient bands |
| `focus` | `#0B57D0` | `#8AB4F8` | `#0033CC` | 3px focus ring, 2px offset |

Sunlight mode is the outdoor case. It uses a pure white background, black text, 2px borders, thicker icon strokes, an 18px base size and no shadows. Status backgrounds go white and the meaning comes from bordered tags.

**Measured contrast** (WCAG ratio, from the prototype). Every text pair passes AA.

| Pair | Light | Dark | Sunlight |
|---|---|---|---|
| ink / bg | 15.5 | 16.3 | 21.0 |
| ink-3 / bg | 6.3 | 7.9 | 15.1 |
| on-primary / primary | 8.0 | 10.4 | 12.3 |
| ok, warn, bad, info on their bg | 5.9–7.8 | 8.0–9.3 | 11.2–13.8 |
| on-lvl / lvl-low, med, high | 7.3 / 6.8 / 8.0 | 9.1 / 12.0 / 11.0 | 10.5 / 10.7 / 12.3 |
| ink-3 / surface-3 (disabled) | 4.8 | 5.3 | 10.8 |

### Type

System font stack: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`. It needs no download and works offline.

| Token | Size (base 17) | Sunlight (base 18) | Weight | Use |
|---|---|---|---|---|
| `3xl` | 36 | 38 | 800 | H1, desktop |
| `2xl` | 30 | 32 | 800 | H1, mobile |
| `xl` | 24 | 25 | 800 | Soil type name |
| `lg` | 20 | 21 | 700 | H2, lead, level label |
| `md` | 17 | 18 | 400 | Body |
| `sm` | 15 | 16 | 400 | Secondary |
| `xs` | 13 | 14 | 700 | Labels, tags, disclaimers |

Line height is 1.5 for body and 1.2 for headings. Numbers use `tabular-nums`.

### Spacing, radii, sizes, breakpoints

- **Spacing (4px grid):** 4 · 8 · 12 · 16 · 24 · 32 · 48. Card padding is 16 (20 at ≥600). Page gutter is 16 (32 at ≥900).
- **Radii:** sm 6 (chips) · md 10 (buttons, inputs, swatches) · lg 16 (cards, upload zone) · pill 999 (badges, tags).
- **Touch targets:** 44 minimum; primary buttons 52; bottom tabs 62.
- **Breakpoints:** container queries on the app shell. 600: two-up grids and row buttons. 900: desktop nav and two-column Result and History. The minimum supported width is 360.

### Tailwind mapping (sketch)

```js
// tailwind.config: colours read CSS variables so one class set covers all three themes
colors: {
  bg: 'var(--bg)', surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
  ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
  line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
  primary: { DEFAULT: 'var(--primary)', soft: 'var(--primary-soft)', on: 'var(--on-primary)' },
  ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)',
  lvl: { low: 'var(--lvl-low)', med: 'var(--lvl-med)', high: 'var(--lvl-high)' },
},
borderRadius: { sm: '6px', md: '10px', lg: '16px' },
// Themes: <html data-theme="light|dark|sun">, with variables defined per theme in globals.css
```

## 5. Copy deck

### Global
- App name: **SAWA**. Subtitle: **Soil Analysis Web App**
- Main disclaimer (Home, Result, Method): **Estimated from photo colour, not a lab test.** Use a lab for fertiliser decisions.
- Per-nutrient label (on every nutrient value): Estimated from colour analysis, not a lab test.
- Footer: SAWA is a student project. Results are estimated from photo colour, not lab tests. · How it works · Roadmap
- Connection pill: Online / Offline (aria: "Server connected" / "Offline mode: analysis runs on this device")
- Display button (aria): Display: Light. Switch to Dark. (and so on for each mode)
- Nav: Home · Analyze · History · About (mobile); Analyze · History · Method · Roadmap (desktop)
- Stepper: 1. Photo · 2. Photo check · 3. Results

### Home
- Eyebrow: Soil Analysis Web App
- H1: Photograph your soil. Get a rough read on what's in it.
- Lead: SAWA estimates soil type, nutrient levels and crops that may suit, from the colours in one photo.
- Buttons: **Analyze my soil** · Try a sample
- How it works: 1 Photo check: We check the photo has enough usable soil. If not, we stop and say why. · 2 Main colours: We find the 5 main colours and how much of the photo each covers. · 3 Estimates: Colour rules give a soil type and rough pH, N, P and K bands. · 4 Crop match: We list crops from a 15-crop list whose needs fit the estimate.
- Link: Read the full method and its limits
- What SAWA can't do: Measure nutrients the way a lab test does. · Recognise objects or plants. The photo check looks at colour and texture only. · Tell you how much fertiliser to use. · Account for climate, rainfall, season or irrigation.
- Offline banner: Offline mode: SAWA still works. Analyses run on this device and are saved in this browser.

### Add photo
- H1: Add a soil photo. Sub: Use a close-up where bare soil fills most of the frame.
- Upload zone: Drag a soil photo here (desktop) / Add a photo of your soil (mobile) · JPEG or PNG · up to 10 MB · Take photo · Choose file
- Drag-over: Drop to add this photo
- Preview: [filename] · [size] · [w × h] px · Ready to check · Replace photo
- Primary: **Run photo check**. Disabled hint: Add a photo first. Ghost: Use the sample photo instead
- Tips title: For a usable photo. Tips: Fill the frame with bare soil. Move leaves, stones and roots aside. · Shoot in daylight, in even light. Avoid hard shadows and direct glare. · Hold the phone straight down, about 30 cm above the soil. · Keep it steady so the grain is sharp.
- Tips footnote: Next, SAWA checks the photo before analysing it. If there isn't enough usable soil, it stops and tells you why.
- Offline banner: The server can't be reached. The analysis will run on this device, and the result will be saved in this browser only. · Try connecting again

### File errors
- Unsupported type: **This file type isn't supported.** [name] is a [TYPE] file. Use a JPEG or PNG photo. On iPhone, you can set Camera › Formats to "Most Compatible".
- Too large: **This photo is too large.** [name] is [x] MB. The limit is 10 MB. Choose a smaller photo or lower your camera's resolution.
- Unreadable: **We couldn't open this image.** [name] may be damaged or only partly downloaded. Try saving it again, or choose another photo.

### Photo check (running)
- H1: Checking your photo
- Body: Before any analysis, SAWA checks that the photo shows enough usable soil. This is a colour and texture check. It does not recognise objects.
- Status line: Checking on this device, then sending to the server / Checking on this device (offline mode)
- Progress: Starting… · Checking [check] · n of 6 · Check complete
- Check names: Resolution · Exposure · Surface detail · Colour composition · Vegetation signal · Sky / water signal
- Row tags: Waiting · Checking · OK · Weak · Fail
- Secondary: Cancel

### Gate: Rejected
- Eyebrow: Photo check: Rejected. H1: This photo can't be analysed
- Reason, one specific line per trigger:
  - Sky/water: Most of the frame looks like sky or water: [n]% of pixels are blue or grey-blue.
  - Foliage: Most of the frame looks like plants: [n]% of pixels are green.
  - Blown out: The photo is too bright to read: [n]% of pixels are blown out to white.
  - Near-black: The photo is too dark to read: [n]% of pixels are near-black.
  - Too small: The image is too small: [w × h] px. It needs to be at least 32 px on each side.
- What to do: Take a close-up where bare soil fills most of the frame, in even daylight.
- No-results note: **No soil results were produced.** SAWA only analyses photos that pass the check, so you won't see estimates for this one.
- Primary: **Take another photo**. Ghost: What makes a good photo?

### Gate: Uncertain
- Eyebrow: Photo check: Uncertain. H1: Not sure this photo shows enough soil
- Reason (template): There isn't enough clear soil in this photo to analyse it reliably. [It is dim / It is blurred / Little of the frame is soil-coloured.]
  - This replaces the current code string "The visible evidence is insufficient for a reliable soil assessment." with plainer wording.
- Badge: Uncertain · [n]%. Meter legend: Marks: 70% needed to analyse · 90% and above is High
- Recommendation: Retake in daylight, closer to the soil, and hold the phone steady.
- No-results note: same as Rejected
- Primary: **Retake photo**

### Gate: Passed
- Eyebrow: Photo check: Passed. H1: This photo looks usable
- Badge: High confidence · [n]% / Medium confidence · [n]%
- Confidence meaning: **What this confidence means:** how strongly the photo's colour and texture look like bare soil. It is *not* the accuracy of the soil results.
- Medium caution: Passed with **medium** confidence. The results may be less reliable. For a better read, retake in daylight with soil filling the frame.
- Next line: Next: main colours, soil type, nutrient estimate and crop matches.
- Primary: **See soil results →**. Ghost (medium only): Retake photo

### Result
- Eyebrow: Soil results. H1: [Type] soil. Meta: [date], [time] · Saved to history / Saved on this device only
- Medium caution: The photo passed the check with medium confidence ([n]%). Treat these results with extra caution.
- Device-only note: This analysis ran on this device while the server was unavailable. It is saved in this browser only.
- Offline banner: Offline mode: this analysis ran on this device. It is saved in this browser only and won't appear on other devices.
- Photo caption: Photo check: [High/Medium] confidence, [n]%.
- **Main colours in the photo**: Colour [n] · RGB r, g, b · #HEX · [n]%. Footnote: Found by grouping the photo's 22,500 pixels (resized to 150 × 150) into 5 colour groups with K-Means clustering. Percent = share of pixels.
- **Soil type (from colour)**. Descriptions:
  - Sandy: Light, pale colour. Sandy soils usually drain fast and hold fewer nutrients.
  - Loamy: Mid-brown colour. Loam is usually a mix of sand, silt and clay.
  - Silty: Yellow-brown colour. Silty soils usually feel smooth and hold water well.
  - Clay: Dark colour. Clay soils usually hold water and nutrients but drain slowly.
  - Mixed: The colours did not fit one rule clearly.
- Soil caveat: Colour alone can't confirm soil type. A feel test or a lab test can.
- Boundary tag: Close to a boundary
- Why this classification: SAWA averages the 5 main colours (each counted equally) and tests that average against colour rules. The first rule that fully matches wins. · Average colour · Black marker = this photo. Tick marks = rule boundaries. · Table: Rule (in order) / Tests / Result: Match · No · Not checked · Not used · Mixed: If no rule matches · Closest boundary: [Channel] is [v], which is [m] [above/below] the [t] limit. A small change in light or moisture could change the soil type. / Comfortably inside this rule.
- **Nutrient estimate**. Badge: Estimate confidence: Low. Body: From a hand-tuned colour formula. It is not a trained model and has not been checked against lab tests. Read the bands, not the numbers.
  - Names: pH (acidity) · Nitrogen (N) · Phosphorus (P) · Potassium (K)
  - Bands: Low / Medium / High; pH: Acidic / Neutral / Alkaline
  - Secondary: Estimated pH ≈ [x] · Acidic below 6.0 · Alkaline above 7.5 / Score ≈ [n] (unitless, [range]) · Low below [a] · High above [b]
- **Crops that may suit this estimate**: [n] of 15 crops matched; showing the first 8. Shown in list order, not ranked. · pH [a]–[b]
  - Footnote: A match means the estimate falls inside a crop's listed needs. It is not a planting recommendation. Climate, water and season are not considered.
- **Empty state, no crop matches**: No crops in our list match this estimate.
  - [n] of the 15 crops accept an estimated pH of [x], but each needs a nutrient level this estimate shows as low: [Crop] ([nutrients]); … / No crop in the list accepts an estimated pH of [x].
  - **This is a limit of SAWA's crop list, not a verdict on your land.** The list has 15 crops and none of them are listed for low phosphorus or low potassium.
  - What you can do: get a lab soil test, or ask your local agricultural extension office which crops suit this soil.
- **How this was calculated**: five numbered steps with this photo's actual numbers (see prototype). Includes: N, P and K include a small random variation, so running the same photo twice can give slightly different numbers. Hand-tuned, not trained, not lab-validated.
- Primary: **Analyze another photo**. Ghost: See history

### History
- H1: History. Meta: Newest first · [n] analyses
- Card: [Type] soil · [date], [time] · [Crop, Crop, Crop] +[n] more / No crop matches · On this device only
- Empty: No analyses yet. Your results will appear here, newest first, once a photo passes the check. Primary: **Analyze my soil**
- Offline: The server can't be reached. Showing analyses saved in this browser. Server history will appear when the connection is back. · Try connecting again
- Detail back link (mobile): ← History

### About / Method
- Eyebrow: About. H1: How SAWA works. Lead: SAWA looks at the colours in a photo of soil and makes rough estimates from them. Here is each step, what it does, and where it falls short.
- Each step has a "what it does" and a **Limits** line (full text in the prototype):
  1. Photo check (validation gate). Limits: It measures colour and texture. It does not recognise objects. A brown floor could pass, and pale soil in harsh sun might not.
  2. Main colours (K-Means). Limits: Light, shadow, moisture and camera settings all change the colours it finds.
  3. Soil type. Limits: Soil type really depends on particle size, which a photo can't measure. Treat it as a hint.
  4. Nutrients. Limits: Not machine learning. Not trained. Not checked against lab tests. A small random variation is added, so repeat runs differ slightly. Do not use it for fertiliser decisions.
  5. Crop matching. Limits: 15 crops is a small list, with none for low phosphorus or low potassium, so some results have no matches. Climate, water and season are not considered.
- Online and offline: When the server is reachable, the photo is analysed there and saved to your history. When it isn't, the same calculations run in your browser and the result is saved on this device only. The method is the same either way.
- Who made this: SAWA is a student project. `Placeholder` [Student name], [Course], [Institution]. Source code: `Placeholder` [repository link].

### Roadmap
- H1: What works today, and what's planned. Lead: Planned items are not in the app. They move to Shipped only when they work.
- Shipped: Photo check (validation gate) with Rejected, Uncertain and Analyzed outcomes · Main-colour extraction with K-Means (k = 5) · Soil type from colour rules · Nutrient estimate from colour (hand-tuned formula, shown as bands) · Crop matching against a 15-crop list · History of past analyses (server storage, with an in-memory fallback) · Analysis in the browser when the server is unavailable
- Planned, each tagged **Planned, not available yet**: Compare estimates with lab test results, using collected soil photos · A larger crop list, including crops for low phosphorus or low potassium · Plant-health analysis · Growth-stage analysis
- Footer: No release dates are promised.

## 6. Accessibility checklist

- Every status uses colour plus an icon plus text: check rows, badges, nutrient bands (↓ – ↑ and a ✓ in the active segment), crop chips.
- Focus is a visible 3px ring with a 2px offset, and is high contrast in all themes.
- Touch targets are at least 44px. Primary buttons are 52px.
- Live regions: check progress (`aria-live="polite"`), file errors (`role="alert"`), offline banners (`role="status"`).
- Charts (stacked colour bar, meters, RGB tracks, nutrient bands) have `role="img"` with a text `aria-label`.
- Motion: only the spinner and progress fill animate, and they slow down under `prefers-reduced-motion`.

## 7. Notes from checking against the code

- **The crop empty state is rare with the current formula.** In `soil-engine.ts`, a crop's "medium"/"low" requirement always passes, and only "high" needs at least medium. The estimated pH stays within 5.0–7.5, which nearly every crop range covers. In practice, "no matches" needs very light soil (pH above 7.0, so only Spinach and Sunflower qualify) together with potassium below 40, which Sandy's base of 40 ± variation hits about half the time. The prototype's Sandy example is built that way. If the Python backend matches differently, the empty state will appear more often, and the copy still holds.
- **Crops are not ranked.** `recommendCrops` returns the first 8 matches in database order. The UI says so ("Shown in list order, not ranked").
- **The nutrient numbers have random variation** (`gaussianNoise`) for N, P and K. This is disclosed in "How this was calculated" and on the Method page. It is one more reason bands are the primary display.
- **The soil-type average is unweighted.** The 5 cluster colours are averaged equally, not by pixel share. This is disclosed in "Why this classification".
