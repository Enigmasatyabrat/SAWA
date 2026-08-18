# SAWA Website — Build Log & Memory Register
Living document. Updated as work progresses. Purpose: keep every factual claim
traceable to a verified source, and keep decisions consistent across a long
session instead of re-deriving or (worse) drifting from them.

Last updated: validation-gate round complete (§8) — real-browser Playwright
pass done, static export rebuilt and re-verified.

---

## 1. GROUND-TRUTH FACTS (verified directly from source files — not the embellished report)

**Source of truth priority when conflicts exist:** actual code (`backend/server.py`,
`frontend/src/App.js`) > automated `test_result.md` > mini-project PDF report >
JSX mockup (`SoilAnalysisApp__1_.jsx`, uses MOCK_RESULT, not real data) > presentation deck.
The PDF report and JSX mockup contain numbers that do NOT match the real code
(different crop list, different NPK units/ranges, "5-7 colors"/"6 clusters" vs
actual hardcoded n_clusters=5, unverifiable UAT claims like "10 users, NPS 70").
**Never state report-only numbers as fact on the site.**

- **App name:** SAWA (Soil Analysis Web App). Zip folder: "SAWA (soil-analysis-app)".
- **Creator:** Satyabrat Mishra. B.Tech CSE (AI & ML), 3rd semester, Roll No. 2401201530053.
- **Institution:** ITM GIDA (Institute of Technology & Management), Gorakhpur, UP. Session 2025-26.
- **Guides:** Dr. Ashutosh Kumar Rao (Assistant Professor, also HoD CSE) and
  Dr. Shubham Srivastava (Assistant Professor) — from report cert/declaration pages.
- **Real contact links (confirmed, do not fabricate others):**
  - GitHub: https://github.com/Enigmasatyabrat (profile only — README's repo URL
    is a literal `<your-username>` placeholder, never filled in. Do not link a specific repo.)
  - LinkedIn: https://www.linkedin.com/in/enigmasatyabrat
  - Email: satyabratmmishra@gmail.com (from presentation deck's Conclusion slide — real, usable now)
- **Location:** Gorakhpur, Uttar Pradesh, IN (matches user's session location context too).

### Actual algorithm (from backend/server.py — this is what the live demo must match exactly)
- K-Means: `n_clusters=5` (hardcoded), sklearn KMeans on 150x150-resized image.
- Soil classification (if/elif in this exact order, on averaged RGB):
  - Sandy: r>180 and g>140 and b>100
  - Loamy: r>100 and g>80 and b>60 and r<150
  - Clay: r<100 and g<80 and b<60
  - Silty: r>120 and g>100 and b<80
  - else: Mixed
- Nutrient prediction (darkness = 1 - avg(r,g,b)/255):
  - ph = clamp(7.5 - darkness*2, 5.0, 8.0)
  - nitrogen = clamp(darkness*100 + N(0,10), 10, 150)
  - phosphorus = clamp((darkness*0.7+0.3)*80 + N(0,8), 5, 100)
  - potassium: Clay→80+N(0,15), Sandy→40+N(0,10), else→60+N(0,12); clamp 20-120
- Level thresholds (from frontend/src/App.js `getNutrientLevel`, exact):
  - pH: <6.0 Acidic, >7.5 Alkaline, else Neutral
  - N: <40 Low, >80 High, else Medium
  - P: <30 Low, >60 High, else Medium
  - K: <40 Low, >70 High, else Medium
  - Units shown in real UI: "Nitrogen (ppm)", "Phosphorus (ppm)", "Potassium (ppm)", "pH Level"
- Crop DB: exactly 15 crops (verified from server.py CROP_DATABASE), each with
  ph:[min,max] and n/p/k in {low,medium,high}: Tomato, Sweet Corn, Lettuce, Carrots,
  Potatoes, Beans, Peppers, Spinach, Broccoli, Cabbage, Wheat, Rice, Soybeans,
  Sunflower, Cucumber. (NOT the report's Wheat/Rice/Maize/Cotton/Sugarcane/... list.)
- recommend_crops matching logic: for req="medium" or "low", that nutrient is ALWAYS
  satisfied regardless of actual level (this looks like a quirk in their original code,
  ported faithfully anyway — not "fixed" since the goal is fidelity, not correction).
  Only req="high" actually filters (needs level high or medium). Returns up to 8, in
  CROP_DATABASE dict order (not sorted by score).
- Endpoints: POST /api/analyze-soil, GET /api/soil-analyses, GET /api/soil-analysis/{id}.
- Backend has an in-memory fallback store if MongoDB is briefly unreachable (real,
  seen in server.py code — legitimate resilience claim).
- test_result.md confirms: 10/10 backend tests passing, frontend tested on
  1920x1080 desktop and 390x844 mobile viewports. Built via "emergent.sh"-style
  agentic testing platform. This is real, citable.
- Deployment story (from CONVERSATION_INTELLIGENCE_REGISTER + report ch.8): first
  Render deployment fought Python 3.13 default runtime (`_bz2` module error),
  fixed via runtime.txt pinning 3.11 + eventual Dockerfile. Real, citable narrative.
- `sample_soil.jpg` in the repo is a 100x100, 824-byte JPEG that is a **perfectly
  flat single RGB colour (73,55,41)** — confirmed via PIL (1 unique color across
  10,000 pixels). It's a backend unit-test fixture, not a real photo. Using it
  raw in K-Means gives 1 cluster at 100%, 4 clusters at 0% — visually broken for
  a demo. FIX APPLIED: `simulateSampleVariance()` adds deterministic
  gradient+grain ONLY when `usingSample===true`; real user uploads are never touched.
  This is disclosed in-UI under the sample button, not hidden.

### Report content used (legitimate, citable, NOT fabricated by me)
- Problem statement stats: govt labs ₹500-800/sample, private ₹1000-2000, total
  with transport/lost day ₹1000-3000; 7-14 day turnaround; ~86% of Indian farmers
  are small/marginal. Real citations: Munsell Soil Color Chart (1905 standard),
  Viscarra Rossel et al. 2006 (soil colour ~50-70% variance explanation, R²=0.72
  for darkness/organic-carbon). These are used in About page journey item 01.
- Report content EXPLICITLY NOT used as site fact: 98% upload success rate, "50+
  concurrent users", specific UAT (10 users, NPS 70, task success rates), 6.2s
  avg analysis time, 6-cluster/5-7 color K-means, kg/ha NPK units, the alternate
  15-crop list — all read as report embellishment not matching the real code.

---

## 2. SESSION TIMELINE / PIVOT HISTORY

1. Turn 1: user uploaded `SAWA__soil-analysis-app_.zip` (full source repo), asked
   for an award-winning agency-style multi-page showcase site, dark/cinematic/glassmorphism,
   pasted a ChatGPT-authored generic spec. Built a 6-page **vanilla HTML/CSS/JS** site
   (`/home/claude/sawa_site/`) — dark near-black/espresso palette, electric teal
   accent, Fraunces/Manrope/IBM Plex Mono, custom cursor, page-transition wipes,
   real client-side port of the algorithm (`js/soil-engine.js`), signature K-Means
   particle hero visualization, live interactive demo on showcase.html. Delivered
   as `/mnt/user-data/outputs/SAWA-website.zip` + individual html files.
2. Turn 2 (user: "is this working, deployment ready site? i dont think so"):
   Did NOT just reassure — actually built real test infrastructure: HTML Tidy
   validation (0 errors), link/ID cross-referencing, WCAG contrast computation
   (fixed one token, `ink-faint`, that was AA-fail on small text), Node unit
   tests for the algorithm port (30/30 passed), then jsdom+node-canvas functional
   tests. **Found and fixed 3 real bugs this way:**
   - `initFeatureAccordions` used `querySelector` (singular) on a combined
     selector, only ever bound the FIRST matching element — the explicit
     toggle `<button>` silently did nothing, only the card head worked. Fixed
     to bind both independently.
   - Confirmed `sample_soil.jpg` is flat-color (see above) — real, visual bug
     for the hero viz — fixed with `simulateSampleVariance`.
   - Two bugs were in MY TEST HARNESS, not the site (documented so as not to
     misdiagnose real code later): (a) manually re-dispatching `DOMContentLoaded`
     when jsdom already auto-fires it once, causing double-init and a
     toggle-cancels-itself false negative; (b) patching `window.Image` AFTER
     scripts already executed and captured the original reference.
   Was mid-way through trying `weasyprint` for visual layout confirmation
   (hit `write_png` not existing on `HTML` object — needed `write_png` via
   a different weasyprint API path) when interrupted by turn 3.
3. Turn 3 (this rebuild): user provided a much more detailed, specific brief
   (big meta-prompt doc: React/Next.js/TypeScript/Tailwind/Framer Motion/shadcn-style/
   Recharts, "Apple/Linear/Stripe/Vercel" aesthetic, earthy palette — Deep Forest
   Green/Earth Brown/Muted Olive/Warm Sand/Soft White/Slate Gray/Accent Moss —
   explicitly NOT the dark cinematic direction from turn 1), plus: 3 real product
   screenshots (ground truth UI reference, matches App.js/HistoryPanel.js analysis
   almost exactly — good cross-check), the real PDF mini-project report, a
   presentation-deck PDF (gave the real email + guide names + confirms palette
   direction), and an "edited" JSX prototype (`SoilAnalysisApp__1_.jsx` — confirms
   the earthy palette hex-for-hex, gives a clean 4-page IA reference, but uses
   `MOCK_RESULT` hardcoded fake data, not a real backend — explicitly NOT used
   as a data source, only as aesthetic/structural reference).
   **Decision: full rebuild in Next.js 16 (App Router) + TypeScript + Tailwind v4
   + Framer Motion + Recharts + lucide-react**, static export (`output:'export'`),
   at `/home/claude/sawa-next/`. Ported the ALREADY-UNIT-TESTED soil-engine.js
   logic to `src/lib/soil-engine.ts` (same algorithm, same thresholds — see §1).
   Palette contrast-checked before committing (same rigor as turn 2's CSS fix):
   `ink-faint` and `sprout`/`soil` decorative tones got separate *-text variants
   for small-text AA safety (see §4).

---

## 3. CURRENT BUILD STATE (Next.js app at /home/claude/sawa-next)

**Pages (App Router, all 6 real routes):** `/` `/about` `/technology` `/analyzer`
`/roadmap` `/contact`. All present, all pass `next build` (static export) and
`next lint` (0 errors, 1 harmless false-positive warning about custom fonts —
see §5).

**Key files:**
- `src/lib/soil-engine.ts` — the ported, verified algorithm. Source of truth
  for crop DB / thresholds if this log and the code ever disagree, trust the code.
- `src/lib/sample-data.ts` — base64 of the REAL sample_soil.jpg (byte-identical,
  confirmed via round-trip decode test in the vanilla-site phase; same file reused).
- `src/components/AnalyzerClient.tsx` — the live demo. State machine:
  idle → preview → analyzing (5-step staged reveal, ~2.1s) → result. Recharts
  BarChart for N/P/K, custom gradient bar for pH (range 5.0-8.0 matches the
  real clamp, NOT the report's 4.0-9.0).
- `src/components/HeroVisual.tsx` — canvas K-Means particle animation, same
  visual design as the vanilla site's hero-viz.js, re-implemented as a React
  component (useRef+useEffect, cleans up rAF on unmount).
- `src/components/Navbar.tsx`, `Footer.tsx`, `BrandIcons.tsx` (hand-rolled
  GitHub/LinkedIn SVGs — **lucide-react in this project's installed version
  (1.24.0) does NOT export Github/Linkedin icons**, had to hand-roll).
- `src/components/PageTransition.tsx` — Framer Motion AnimatePresence keyed on
  `usePathname()`.

**Two real build-blocking issues found and fixed (not test-only, these would
have broken the actual deployed site):**
1. `next/font/google` tries to fetch fonts.googleapis.com at BUILD time — not
   in this sandbox's network allowlist, build failed with a 403. Fixed by
   dropping next/font and loading Geist/Geist Mono/Source Serif 4 via a plain
   `<link>` tag in `layout.tsx` `<head>` instead (fonts.googleapis.com IS
   reachable from an end user's real browser at runtime — this only failed
   because MY build sandbox is network-restricted, not a problem for the
   deployed site). Font vars defined manually in globals.css `:root`.
2. `lucide-react@1.24.0` has no `Github`/`Linkedin` exports (brand icons were
   dropped from the package). Fixed with hand-rolled inline SVGs in `BrandIcons.tsx`.

**Lint fixes applied (React 19 / eslint strict rules):**
- `soil-engine.ts`: `let labels` → `const labels` (array mutated by index, never reassigned).
- `Navbar.tsx`: removed a `useEffect(() => setOpen(false), [pathname])` (React
  19 flags synchronous setState-in-effect as a cascading-render risk) — replaced
  with a direct `onClick={() => setOpen(false)}` on each mobile nav `<Link>`.
- Removed one unused import (`ArrowUpRight` in about/page.tsx).

---

## 4. VERIFICATION LOG (what's actually been tested, not assumed)

| # | What | Method | Result |
|---|------|--------|--------|
| 1 | Algorithm correctness (kmeans, classify, predict, recommend, levelOf) | Node unit tests, 30 assertions, synthetic bimodal pixel data + 500-trial range fuzzing | 30/30 PASS |
| 2 | WCAG contrast, full palette | Python luminance/contrast calc against every fg/bg pair actually used | All pairs ≥4.5:1 (AA) after 1 fix; most ≥7:1 (AAA) |
| 3 | HTML validity (vanilla site, superseded) | `tidy -e` all 6 pages | 0 errors |
| 4 | `next build` (static export) | actual `npm run build` | Compiles, typechecks, 9/9 static pages generated |
| 5 | `next lint` | actual `npm run lint` | 0 errors, 1 harmless false-positive warning |
| 6 | Real component mount + full analyzer user flow | esbuild-bundled AnalyzerClient, mounted via real `react-dom/client` in jsdom+node-canvas, simulated clicks | Mounts clean, sample→analyze→result flow completes with 0 console errors, 8 crop chips, correct soil type text found in DOM. Recharts chart reported width=0 (see below — this is a jsdom-has-no-layout-engine artifact, not a real bug; independently confirmed via `getBoundingClientRect()` returning all-zero in this same jsdom instance) |
| 7 | **Real Chrome (cached puppeteer binary, v131) end-to-end** | IN PROGRESS as of this log entry — see below | pending |

**Why #6's Recharts warning is believed to be a test-env artifact, not a real
bug:** jsdom has no layout engine at all (independently verified twice:
`getBoundingClientRect()` returns `{0,0,0,0}` unconditionally in jsdom regardless
of CSS). Recharts' `ResponsiveContainer` measures real parent pixel size to
draw; a fixed-pixel-height wrapper (`h-[180px] w-full`, not a % height) is the
documented-safe Recharts pattern for real browsers. Pass 7 (real Chrome) is the
test that actually settles this instead of leaving it as inference.

---

## 5. KNOWN NON-ISSUES (checked, confirmed harmless, don't re-investigate)

- ESLint warning `@next/next/no-page-custom-font` on layout.tsx: this rule
  assumes Pages Router (`pages/_document.js`); App Router's `layout.tsx` `<head>`
  IS the correct/recommended place for this. False positive, not fixable
  (nor should it be "fixed") in App Router.
- `npm warn config prefix cannot be changed` during `create-next-app`: unrelated
  global npm config note, project still scaffolded successfully.
- Multiple lockfile / workspace-root Turbopack warning: fixed via
  `turbopack: { root: __dirname }` in next.config.ts.

## 6. FINAL REAL-BROWSER VERIFICATION RESULTS (Pass 1-4, real Chrome v131, cached puppeteer binary)

**44 checks run, 36 passed outright, 8 "failed" — and all 8 are the exact same
root cause repeated across pages, independently confirmed to be a test-sandbox-only
limitation, not a site bug (see below). Net result: every distinct functional/content
assertion passed.**

- PASS 1 (all 6 pages, desktop 1440x900): HTTP 200, correct title, correct H1
  text matching real content, no page crashes, no horizontal overflow — ALL PASS
  on every page. Only failure per page: one repeated console error.
- PASS 2 (mobile 390x844): no overflow on any of the 6 pages, hamburger button
  visible, mobile menu opens and shows links, Analyzer link navigates correctly
  — ALL PASS.
- PASS 3 (the real Analyzer interaction, desktop): use-sample click, preview
  render, analyze click, full 5-step sequence, result content ("Classified as",
  real soil type text, "Recommended crops", "Dominant colours") — ALL PASS.
  **Recharts chart genuinely renders**: svgWidth:563, svgHeight:162, barCount:3
  — this DEFINITIVELY settles the jsdom-era "width=0" warning from §4 as a
  jsdom-has-no-layout-engine artifact, not a real bug; real Chrome renders it
  correctly. 8 crop chips rendered (the real max cap). Re-run analysis works
  clean a second time, no state corruption. Only failures: the same repeated
  console error, twice (once per analysis run).
- PASS 4 (client-side nav): nav-link click correctly triggers Next.js client
  routing to /technology, real content loads — ALL PASS.

**The repeated "failure" root cause, confirmed:** every single one of the 8
failures is `'Failed to load resource: the server responded with a status of
403 ()'` — the same message, every time. Directly verified via `curl
https://fonts.googleapis.com/... ` FROM THIS SANDBOX returning 403 (this
sandbox's bash_tool network egress allowlist does not include
fonts.googleapis.com/fonts.gstatic.com — this was already known from §3's
next/font build-time finding, and this is the same restriction biting Chrome's
runtime network requests too, since it's the same container). **A real
end-user's browser has normal internet access and will load Google Fonts
fine** — this is not fixable nor needs fixing; it is exclusively an artifact
of testing inside this network-restricted sandbox.

**Screenshots reviewed directly** (`/tmp/shots/*.png`, 16 total: 6 pages x
desktop, 6 pages x mobile, plus analyzer preview/scanning/result close-ups,
plus mobile-menu-open): confirmed visually coherent layout, correct earthy
palette rendering (fallback system fonts instead of Geist/Source Serif since
Google Fonts couldn't load in-sandbox — cosmetic only, not layout-affecting),
proper card grids, no visual breakage, working scan-line animation frame
captured mid-analysis, working chart+crop-chips in the result state.

**Conclusion: this is now genuinely verified working, not just "should work."**
Confirmed via: unit tests (algorithm), static analysis (build/lint/types),
AND full real-browser end-to-end interaction testing with visual screenshot
review. This is a materially stronger evidence base than the vanilla-HTML
build's verification in Turn 2 (which never got real-browser confirmation
before being superseded).

## 7. REMAINING TASKS (from the original build — closed out)

- [x] Write a README.md with real deploy instructions (npm install / npm run
      dev / npm run build / deploy to Vercel or any static host from `out/`).
- [x] Clean the deliverable of test-only artifacts (test_real_browser.js,
      any stray node_modules from --no-save installs don't get zipped anyway
      since we zip source, not node_modules).
- [x] Package and present to user with an honest, evidence-cited summary —
      no unverified claims, cite the real-Chrome test pass as the headline
      evidence this time (stronger than turn 2 had available).

*(Earlier diagnostic trail for the first, failed Puppeteer attempt — server
config issue, not a site bug — preserved above in §3/§6 narrative rather than
repeated here.)*

---

## 8. VALIDATION GATE — image-quality & confidence system (new round)

**Brief, as given:** a "System Prompt — Soil Image Analysis" spec, written
for a full vision-model-backed AI system: validate the image is usable soil
(Step 1, hard reject otherwise), estimate confidence and abstain below 70%
(Step 2), and only then analyze — every prediction carrying its confidence
and the visual evidence behind it (Step 3). Absolute rules: never guess,
never force a classification, never fabricate evidence, abstain over
speculation.

**The gap to close:** SAWA's Analyzer has no backend and no ML runtime — it's
a static export running a ported colour-clustering algorithm entirely in the
browser (§1 above). There is no vision model here to run that system prompt
against. Two deliverables came out of reconciling that:

1. `VALIDATION_SYSTEM_PROMPT.md` — the spec itself, rewritten and extended
   as a proper system prompt a real model-backed version of this gate would
   use (structured output schema, worked examples per verdict, explicit
   edge cases the original draft didn't cover — multi-region frames, a hand
   holding soil, wet vs. dry colour shift). It also documents, rule by rule,
   what today's heuristic implementation can and can't actually check.
2. `src/lib/image-validation.ts` + `src/lib/evidence.ts` — a best-effort,
   honestly-scoped, deterministic approximation of that spec's Step 1/2/3
   using only what's measurable from pixel data: colour composition (HSV
   hue/sat/val bucketing), exposure (mean luminance + near-black/near-white
   fractions), a texture/detail proxy (mean local luminance-gradient
   magnitude — a centred-difference stand-in for a Sobel operator), and
   resolution. No ML model, no training data, no randomness — same inputs
   always produce the same verdict.

**Explicit, disclosed scope limit (this matters — see the "Absolute Rules"
in the spec about never fabricating):** colour/texture statistics can
defensibly flag "reads as sky-blue", "reads as vegetation-green", "too
dark/bright/flat to read", or "too small to sample". They cannot recognise
specific objects — a person, a building, a car — the way a trained vision
model could. Rather than fake that capability, the implementation falls back
to its one real signal (does this look predominantly soil-coloured, with
plausible texture, at usable resolution/exposure?) and abstains (Uncertain)
when that signal is weak, instead of asserting a category it has no evidence
for. Verified concretely: a smooth pale-grey/tan surface (meant to stand in
for a wall or dry concrete) reads at ~78% confidence in testing below,
because colour alone genuinely cannot separate it from pale, ashy dry soil —
documented as a known limitation, not silently overclaimed.

**Architecture decision — did not touch `soil-engine.ts`.** The classifier
and nutrient formulas are the faithful backend port (§1) and stay
byte-for-byte as delivered. `image-validation.ts` is a pure, DOM-free module
(metrics computation and verdict evaluation are separate functions, neither
touches the DOM) that runs on the same pixel grid before K-Means does its
own thing. `evidence.ts` derives soil-type classification confidence by
re-examining `classifySoilType`'s own if/elif thresholds from the outside —
"how far is the average colour from the nearest rule boundary?" — rather
than adding a second, independent confidence model that could drift from
what the classifier actually does.

**Bug found and fixed in passing:** `/technology` has always stated the
image resizes to 150×150 before K-Means. The Analyzer component was actually
calling `pixelsFromImage(img, 50)` — a 50×50 sample, not 150×150. Pre-existing,
not introduced by this round, but touched while wiring the validation gate
in (both now read from `pixels`/`gridSize` sampled once at 150×150, shared
between K-Means and the validation metrics). 22,500 samples vs. 2,500 is
still trivial cost in-browser; verified below.

**Confidence math, so the numbers in the UI are traceable:**
`confidence = round(100 * (0.42·soilColourScore + 0.18·exposureScore +
0.22·textureScore + 0.18·resolutionScore))`, each sub-score a documented 0-1
function of one measured quantity (see `VALIDATION_THRESHOLDS`/
`VALIDATION_WEIGHTS` exported from `image-validation.ts`). Verdict:
confidence <70 and no hard-reject condition → Uncertain; hard-reject
conditions (near-total sky/vegetation/blank-frame signal, or below a 32px
hard resolution floor) → Rejected regardless of the weighted score; else OK,
tagged Medium (70-89) or High (\u226590).

**Testing performed (Node, `--experimental-strip-types`, no build step
needed — same pattern as §4's unit tests):**
- Pure-function tests against synthetic pixel grids built with the *actual*
  `simulateSampleVariance` logic (not hand-waved): the real bundled
  `sample_soil.jpg` fixture (flat RGB(73,55,41) → through
  `simulateSampleVariance` exactly as the app runs it) scores **87%
  confidence, Medium band, verdict OK** — clears the gate on its own
  merits, no special-casing needed. Four synthetic soil tones (sandy,
  loamy, dark clay, grey silty) all cleared OK. A synthetic sky photo, a
  grass/lawn photo, a blown-out white frame, a near-black frame, and a 20×20
  placeholder were all correctly **Rejected**, each with a distinct,
  evidence-based reason. A deliberately ambiguous patchy grass+soil, low-
  texture composite landed **Uncertain at 65%** — confirming the middle
  band is actually reachable, not just theoretical.
- `evidence.ts` margin math checked against soil-engine's real `analyze()`
  output across five colours spanning all five classes, confirming
  direction (deeper in-range → higher confidence; near a rule boundary →
  lower confidence; Mixed's confidence direction correctly inverts, since
  for Mixed, farther from every rule is the *more* confident call).
- `npx tsc --noEmit` and `npm run lint`: clean (the one pre-existing
  font-loading ESLint warning from §5, nothing new).
- `npm run build`: compiles, typechecks, 9/9 static pages — unchanged page
  count, same as §4 row 4.
- **Real Chrome (same cached puppeteer v131 binary as §6/§7), this time via
  Playwright** against the actual `next build` static export served over
  `http.server`, headless, 1440×1100 desktop + 390×844 mobile: bundled
  sample → analyzes, confidence badge + both evidence disclosures expand
  and show real numbers; a real textured soil-toned JPEG upload → analyzes;
  sky/grass/overexposed/tiny uploads → all correctly show the Rejected
  panel, literal `Analysis Status: Rejected` block, and the specific
  evidence reason, with no soil-type or nutrient numbers shown; the
  patchy/low-detail upload → correctly shows Uncertain with its own literal
  status block; "Choose a different image" after a rejection resets cleanly
  and a follow-up good photo analyzes correctly (no state leakage between
  runs); mobile viewport renders without layout breakage. Only console
  "error" across every page load: the same `fonts.googleapis.com` 403 from
  §6, confirmed still exclusively a sandbox-network artifact, not a site
  bug — real end-user browsers load these fonts fine.

**Content pages touched, and why:** `/technology` gets a new, visually
distinct callout ahead of the (unchanged) six-step numbered pipeline,
explicitly labelled "not part of backend/server.py" — the numbered pipeline
itself was left alone so it stays an accurate mirror of the real backend.
`/roadmap`'s "Confidence indicators" near-term item is genuinely shipped now
— moved to a new "Shipped" section rather than just deleted, so the roadmap
stays an honest record of what happened, not just what's still pending.
`README.md` documents the two new lib files and points to
`VALIDATION_SYSTEM_PROMPT.md`/`IMPROVEMENTS.md`. `AnalyzerClient.tsx`'s
existing "this runs the exact backend/server.py logic" disclosure paragraph
was extended, not replaced, to separately call out that the validation gate
above it is the new, non-backend part — keeping the original fidelity claim
intact and accurate rather than blurring it.
