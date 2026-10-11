# ADR-SAWA-001
# SAWA Architecture Decision Records — Batch 1

---

## Document Control

| Field | Value |
|---|---|
| Document ID | ADR-SAWA-001 |
| Version | 0.1.0 |
| Status | Draft — first batch |
| Created | 15 August 2026 |
| Depends on | `memory.md`, `BUILD_LOG.md` (Next.js showcase), original `backend/server.py` |

---

## ADR-001 — Consolidate to one canonical repo before any new feature work

**Context.** Three artifacts currently exist under the "SAWA" name: the
original full-stack app (real backend, messy deployment history), the
Next.js showcase site (portfolio-quality, but a client-side port, not the
product), and now this corpus. The uploaded original-app zip is 357MB
because it includes a full `.venv` and presumably `node_modules` were
similarly present in git history — meaning version control on that repo has
not been treating build artifacts correctly.

**Decision.** Phase 0 (see `SAWA-Roadmap.docx`) is repo consolidation:
pick the original full-stack app as the canonical repo (it has the real
backend — the showcase site explicitly has none), fix `.gitignore`, and
treat the Next.js site as a linked, separately-deployed marketing artifact,
not a fork to keep in sync by hand.

**Why.** You cannot build Phase 1 (data collection) or Phase 2 (real ML) on
top of a repo where a stray `git add .` might commit an 850MB virtual
environment. This is boring but it is the actual first blocker.

**Status.** Decided. Not yet executed.

**Update, 11 Oct 2026 — superseded.** The canonical repo became the unified
Next.js app (`Enigmasatyabrat/SAWA`, v2.0.0 — see `RELEASES.md`), not the
original full-stack app. `soil-analysis-app` is archived for reference. The
goal of this ADR — one canonical repo — stands; the choice of which repo
does not.

---

## ADR-002 — What to do about the `recommendCrops` / `recommend_crops` bug

**Context.** Confirmed identical in both the original Python
`backend/server.py` and the TypeScript port: for a crop requirement of
`"medium"` or `"low"`, the nutrient check is unconditionally satisfied
regardless of the soil's actual level. Only `"high"` requirements filter
anything. This was a real bug in the originally-submitted project, not
something introduced by the later port (the port preserved it deliberately,
for fidelity, per `BUILD_LOG.md`).

**Options considered.**
1. Leave it as-is in both places (fidelity to what was actually built/graded).
2. Fix it in the Next.js showcase only (it's the public-facing demo; a
   showcase site plausibly deserves to be *correct*, separately from
   "faithful to the original").
3. Fix it in both, and note the fix explicitly as a documented correction
   in the corpus (turns a bug into a demonstrated debugging story — which
   is a genuinely good thing to be able to point to).

**Decision.** Option 3. Executed 15 Aug 2026 in `soil-engine.ts` only (the
Next.js showcase site — this is what's public-facing right now; the
original `backend/server.py` has the identical bug and should get the same
fix whenever that repo is next actively worked on, tracked as a follow-up,
not forgotten).

**The actual fix:** replaced the three ad-hoc boolean expressions with a
single ranked comparison — `levelMeets(actual, required)` returns true iff
`rank(actual) >= rank(required)` (low=0, medium=1, high=2). This is the
smallest change that makes all three levels (not just "high") actually
filter on the real measured nutrient level.

**Verified before shipping (not just assumed correct):** ran the new logic
against the full 15-crop database across a swept range of darkness/pH
values and compared counts against the old buggy version. Two things worth
recording:

1. The fix is a strict tightening, not just a bug patch — the old "high"
   branch was lenient (`medium` OR `high` actual satisfied a `high`
   requirement); the new ranked comparison requires `high` actual for a
   `high` requirement. This is the logically consistent choice (matches
   what `levelOf()`'s Low/Medium/High labels already claim to mean) and
   was a deliberate call, not an oversight — see the commit/patch note in
   `soil-engine.ts` itself.
2. **Real consequence found via testing:** no crop in the current 15-crop
   database has a `"low"` potassium requirement. Combined with the
   heuristic that pins Sandy Soil's potassium baseline low (~40, vs. 60 for
   Mixed/Loamy/Silty and 80 for Clay), Sandy Soil results will now show the
   "no strong matches" empty state noticeably more often than other soil
   types — roughly half the time or more depending on the noise draw,
   confirmed deterministically empty at the noise-free baseline. This is
   **not a bug** — it's the filter honestly reporting that the crop
   database has a real content gap (zero low-K-tolerant crops), which the
   old buggy filter was silently papering over. The UI already had a
   graceful empty-state message for this case
   (`AnalyzerClient.tsx`: "No strong matches in the 15-crop database for
   this exact profile..."), so this didn't need a UI change — just
   documenting here so it's a known, understood behavior rather than a
   surprise. **Follow-up for Phase 1/DATA-SAWA-001:** consider adding at
   least one low-K-tolerant crop to the database, since right now Sandy
   Soil is structurally underserved regardless of how accurate the model
   gets.

**Status.** Done (Next.js site). Backend `server.py` fix still open.

**Update, 11 Oct 2026.** Until now this fix existed only in the local v1.0
consolidation tree and had never reached either GitHub repo. Ported into
`Enigmasatyabrat/SAWA` `src/lib/soil-engine.ts`, which also serves the API
route, so the server and the UI share it. Re-verified:

- 0 rule violations across 6,696 swept `(pH, N, P, K)` inputs — every
  returned crop meets all four requirements.
- Every crop the new filter returns is also returned by the old filter once
  its `slice(0, 8)` truncation is removed — the fix only removes false
  positives.
- Through the real pipeline (colour → nutrients, 20 noise draws each),
  empty results rise from 0.2% to 54.4% for Sandy Soil, matching point 2
  above. Clay 13.4%, Mixed 6.5%, Silty 5.4%, Loamy 3.9%.

The empty-state copy **was** changed after all: it claimed such cases are
"part of why the model keeps improving", but there is no model and nothing
learns from these results. It now says what is true. The `server.py` fix
lives in the v1.0 tree; `soil-analysis-app` is archived and was not patched.

---

## ADR-003 — Phase 2 starts with tabular ML, not deep learning

**Context.** The stated goal is "make it an ML model so it learns and has
more accuracy to begin with," fed by real test results. The realistic
constraint: a solo developer's first real dataset is going to be small —
likely tens to low hundreds of labeled samples (photo + lab-verified NPK/pH
result), not the thousands-to-millions a CNN trained from scratch needs.

**Decision.** Phase 2 v1 model: scikit-learn (RandomForestRegressor or
GradientBoostingRegressor) on **engineered features** — the same K-Means
dominant colors already extracted, plus texture/statistics features (color
variance, RGB histograms) — predicting pH/N/P/K directly from real lab
labels. This replaces the *hand-picked heuristic formula*, not the K-Means
color extraction step (that part is legitimate unsupervised clustering and
can stay).

Deep learning (CNN, transfer learning from a pretrained backbone) becomes
worth it once: (a) the dataset is large enough that a tree-based model's
accuracy plateaus, or (b) the task genuinely needs spatial/texture
information a flattened color vector can't capture (this is much more
likely to be true for the growth-stage task in ADR-004 than for the soil
color→nutrient task here).

**Why this order.** A small tree-based model on real labels, even 50–100
samples, is already strictly more honest than the current heuristic,
because its outputs are traceable to actual measurements instead of a
formula someone picked because it looked reasonable. Jumping straight to
deep learning without the data to support it just produces an overfit model
that *feels* more sophisticated while being less trustworthy.

**Status.** Proposed. Depends on DATA-SAWA-001 (dataset engineering doc,
not yet written) existing first — you cannot design the model before you
know what the label distribution actually looks like.

---

## ADR-004 — "Plant age from multiple angles" reframed as growth-stage classification

**Context.** The stated goal includes "determining the age of the plant
using images from different sides... something not yet done." Worth being
precise here rather than either dismissing the idea or overselling it.

**What's actually true:**
- Estimating a plant's **exact chronological age** from images alone,
  with no other information, is not a solved general problem — growth rate
  depends on species, light, water, soil, and genetics, so two plants of
  the same age can look very different, and appearance alone underdetermines
  age.
- However, this *is* an active, published research area under different,
  more precise names: **plant growth-stage classification** (BBCH scale,
  used across agronomy), **leaf counting / phenotyping** (datasets like
  PlantVillage, PlantDoc), and **days-since-planting regression** *when
  planting date is already known* (which turns the problem from
  "guess the age of an unknown plant" into "track a known plant's growth
  over time" — a much more tractable and honestly more useful problem for
  a farmer who planted the seed themselves).
- Multi-angle capture (your instinct) is a real, used technique in
  phenotyping platforms (multi-view imaging rigs exist in agricultural
  research) — it genuinely helps because it captures leaf count and canopy
  structure that a single photo misses.

**Decision.** Build this as: (1) growth-stage classification (discrete
labels: seedling / vegetative / flowering / fruiting / senescent) as the
Phase 4 MVP, using multi-angle photos as the input, and (2) days-since-
planting regression as a stretch goal *only* for the tracked-by-the-user
case (where planting date is logged in the app, turning it into a
supervised time-series problem instead of a one-shot guess).

**Why this framing matters.** "Not yet done" is a claim that will get
checked by anyone technical who looks at this project (an examiner, a
grad-school committee, a potential co-founder). The differentiation you
actually have isn't "nobody has done plant phenotyping" — it's "a
smartphone-only, no-lab-equipment, farmer-facing version of it, integrated
with the soil-analysis pipeline in one app." That's a real, defensible
differentiation. Claiming novelty on the underlying CV problem when the
literature exists undermines the credible parts of the pitch.

**Status.** Proposed, Phase 4 (not started — Phase 1–2 come first).

---

## ADR-005 — Corpus scope: adapted from WG-REC, not copied

**Context.** You referenced the `WG-REC` (Water Guardian) corpus as the
pattern to follow, correctly noting it "doesn't keep up everything as it
is" for SAWA — meaning SAWA is a different-shaped project (single-developer
computer vision + agtech app vs. WG's multi-agency, multi-satellite-dataset
water-monitoring research platform with a thesis and conference-paper
target).

**Decision.** Reuse WG's document-ID scheme and "one concern, one document"
discipline. Do **not** reuse WG's specific document set 1:1 — SAWA doesn't
need eleven external-integration specs (API-WG-001) because it doesn't have
eleven external data providers. Most of SAWA-REC's registry is marked
`PLANNED` in `SAWA-REC-INDEX.md` on purpose — write each document when
you're about to act on it, not speculatively ahead of time. This is a
direct application of SP-007 (ship one phase before starting the next).

**Status.** Decided.

---

## ADR-006 — memory.md format: state file, not narrative register

**Context.** The original project already has a
`CONVERSATION_INTELLIGENCE_REGISTER.md` — a 34-entry narrative history
("what happened, why it mattered, what a future AI must know"). Excellent
for preserving *reasoning history*, less useful as a fast "what do I do
right now" reference for an agentic coding session.

**Decision.** `memory.md` is a compact, scannable **state** file (current
ground truth, decisions, one next action) that references the narrative
register rather than duplicating it. Keep both — they serve different
purposes. Update `memory.md` at the start and end of every work session;
only add to the narrative register when something genuinely
history-worthy happens (a pivot, a hard-won lesson), not every session.

**Status.** Decided, implemented this session.

---

## ADR-007 — Cache canvas dimensions instead of measuring every frame

**Context.** `HeroVisual.tsx` drives the homepage K-Means particle
animation. Its `render()` loop called `sizeCanvas()` on every
`requestAnimationFrame` tick (~60/sec). `sizeCanvas()` calls
`getBoundingClientRect()` *and* assigns `canvas.width`/`canvas.height` —
the first forces a synchronous layout reflow, the second reallocates the
canvas bitmap and resets its 2D context state. Neither needs to happen
more than once unless the element actually resizes.

**Decision.** Hoist `w`/`h` into the `useEffect` scope, populate them once
when the animation starts, and refresh them only from the existing
`resize` listener. Executed 17 Aug 2026.

**Implementation note worth recording.** The first attempt at this patch
declared `let { w, h } = sizeCanvas()` inside `start()`, which type-checked
but was wrong: `onResize` lives in the outer effect scope and so was
assigning to a *different* binding than the one `render()` closed over —
the cached size would never actually update on resize. Caught by reading
the patch back before shipping rather than by the compiler, since both
versions are valid TypeScript. Final version declares `w`/`h` once in the
effect scope so both functions share one binding.

**Verification.** `tsc --noEmit` clean, `eslint` clean, full `next build`
succeeded, static export served and pages returned 200.

**Status.** Done.

**Update, 11 Oct 2026.** Like ADR-002, this fix had only ever existed in the
local v1.0 tree. Ported into `Enigmasatyabrat/SAWA` `src/components/HeroVisual.tsx`
and re-verified in a real browser: with `getBoundingClientRect` instrumented,
0 calls over one second of animation (previously one per frame); the canvas
still animates; and after resizing the viewport the bitmap re-measures to
1080×1080 for a 540px mount at 2× DPR — the shared-binding fix holds.

---

## ADR-008 — Crop database has a structural gap in P and K (found by testing, not by reading)

**Context.** While verifying the ADR-002 fix by sweeping the whole crop
database across a range of darkness/pH values, the corrected filter
returned **zero crops for Sandy Soil at every single darkness level**.

**Root cause (verified by loading `CROP_DATABASE` directly out of the real
`server.py` and enumerating the distinct requirement levels):**

| Requirement | Distinct levels present across all 15 crops |
|---|---|
| `n_requirement` | `low`, `medium`, `high` |
| `p_requirement` | `medium`, `high` — **no `low`** |
| `k_requirement` | `medium`, `high` — **no `low`** |

No crop in the database tolerates low phosphorus or low potassium. The
heuristic assigns Sandy Soil a potassium baseline of ~40 (vs. 60 for
Loamy/Silty/Mixed and 80 for Clay), which lands on `low` — so *every*
Sandy Soil result fails the K check regardless of anything else. Low-P
soils fail identically.

**This is a data gap, not a logic bug.** The old broken filter masked it by
passing everything. The corrected filter surfaces it honestly.

**Decision.** Ship the fix as-is. The UI already renders a graceful
empty state for this case (`AnalyzerClient.tsx`: "No strong matches in the
15-crop database for this exact profile…"), so nothing breaks. Record the
gap here and address it as a **data** task in Phase 1: add crops that
genuinely tolerate low P/K (groundnut, millets, and cowpea are the usual
agronomic candidates for sandy, low-fertility soils — verify against a real
agronomic source before adding, per SP-004, rather than trusting this note).

**Why this matters beyond the bug.** This is the first concrete instance of
the pattern the whole roadmap is built around: the model was never the
binding constraint here — the *data* was. Worth remembering before Phase 2.

**Status.** Fix shipped. Database expansion open, assigned to Phase 1.
