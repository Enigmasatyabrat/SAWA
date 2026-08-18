# IMPROVEMENTS.md

## What was asked, and how I read it

You gave me a system prompt written for a soil-image validation AI —
validate the image first, gate on confidence, never guess, cite evidence
for every prediction — and asked me to "invent yourself" while keeping it
in mind, then ship a final zip with this changelog.

SAWA has no backend and no vision model in this deliverable — the Analyzer
is a static export that runs a ported colour-clustering algorithm entirely
in the browser. There's nothing to literally hand that system prompt to.
So I split the work in two:

1. **Improved the spec itself.** `VALIDATION_SYSTEM_PROMPT.md` is your
   draft, rewritten and extended into something a real, model-backed
   version of this gate could actually run — bound to SAWA's real 5-class
   taxonomy, given a JSON output schema, given worked examples for every
   branch, and given explicit rules for cases the original didn't cover
   (a soil photo with a strip of sky at the top, a hand holding the
   sample, wet vs. dry soil colour shift).
2. **Built the closest honest approximation of it that a static site can
   run.** The Analyzer now validates every photo — reject, uncertain, or
   analyzed with confidence — using real pixel statistics computed from
   the actual image, before any soil prediction happens. Nothing about
   this was faked to look more capable than it is; see **Scope &
   limitations** below.

## What changed, concretely

**New: the validation gate.** Before Extract/Classify/Predict/Recommend
run, a new "Validate" step checks the uploaded photo against four signals —
colour composition, exposure, surface texture/detail, and resolution — all
measured from the same pixel grid K-Means uses. Three outcomes:

- **Rejected** — the frame is dominantly sky, water, foliage, blown-out,
  near-black, or too small to sample. Pipeline stops. No soil type, no
  nutrients, nothing invented.
- **Uncertain** — nothing screams "wrong subject," but combined confidence
  is under 70%. Pipeline stops. A specific reason and recommendation are
  shown instead.
- **Analyzed** — confidence ≥70%, tagged Medium (70–89%) or High (≥90%).
  The full result appears, with that confidence score and its evidence
  attached and visible, not just computed and discarded.

Try it: a sky photo or a lawn photo now gets rejected with a real reason
instead of a confidently wrong "Sandy Soil, pH 6.2." A dim, low-detail
photo gets flagged Uncertain instead of a guess dressed up as a reading.

**New: classification evidence.** Soil-type confidence is no longer
implicit — `src/lib/evidence.ts` computes how far the sampled colour sits
from the classifier's own decision thresholds (deep in-range → high
confidence; near a boundary → low confidence) and shows the actual numbers
behind the call, expandable under "Why this classification."

**Fixed: the analyzer was quietly sampling at 50×50.** `/technology` has
always said the image resizes to 150×150 before K-Means; the client-side
port was actually using 50×50. Found while wiring the shared pixel grid
into the validation gate, fixed alongside it — both now genuinely run at
150×150.

**Content pages updated to match:** `/technology` explains the new gate in
a clearly-labelled callout (distinct from, and explicitly not part of, the
six-step backend-mirroring pipeline below it). `/roadmap`'s "Confidence
indicators" item moved from "near-term idea" to a new "Shipped" section.
`README.md` documents the two new lib files. The Analyzer's existing
"this matches backend/server.py exactly" disclosure was extended, not
replaced, to make clear the validation layer is new and additive, not part
of the original mini-project's backend.

**Files touched:**
```
NEW   src/lib/image-validation.ts     validation metrics + verdict logic
NEW   src/lib/evidence.ts             classification confidence/evidence
NEW   VALIDATION_SYSTEM_PROMPT.md     the improved spec (Part A) + honesty
                                       mapping against what's shipped (Part B)
NEW   IMPROVEMENTS.md                 this file
EDIT  src/components/AnalyzerClient.tsx   wires the gate into the UI/flow
EDIT  src/app/technology/page.tsx     documents the new gate
EDIT  src/app/roadmap/page.tsx        "Confidence indicators" marked shipped
EDIT  README.md                       structure + doc pointers
EDIT  BUILD_LOG.md                    §8, full record of this round
UNCHANGED  src/lib/soil-engine.ts     the ported backend algorithm — not touched
```

## Where each rule in your spec landed

| Your spec | What happened |
|---|---|
| Step 1: reject if not soil / wrong subject / unusable image | Implemented for what colour+texture statistics can defensibly catch (sky, foliage, blank/blown frames, too-small images). Object categories like people/buildings/vehicles are explicitly **not** claimed — see below. |
| Step 2: confidence bands, abstain below 70% | Implemented exactly: <70 Uncertain, 70–89 Medium, ≥90 High, computed from four named, weighted sub-signals (not one opaque number). |
| Step 3: every prediction gets confidence + evidence | Implemented for the image reading (validation confidence, shown with its full checklist) and for soil-type classification (margin-based confidence with real rgb values and threshold math shown). Nutrients inherit the reading's confidence rather than getting invented separate numbers — seemed more honest than manufacturing false precision (see below). |
| "Cannot be determined from the image" for weak evidence | Where a signal genuinely isn't measurable (object recognition, moisture detection), the spec and code both say so directly instead of a workaround guess — see `VALIDATION_SYSTEM_PROMPT.md` Part B. |
| Absolute rules: never guess, never force a class, never fabricate | Mixed Soil is a legitimate, sometimes-confident answer, not a forced fallback (see the margin logic in `evidence.ts`). No category is claimed unless there's a real, testable signal behind it. |

## Scope & limitations, stated plainly

A colour/texture heuristic is not a vision model. It can measure "does this
read as soil-coloured, with plausible texture, at usable exposure and
resolution" — and it does that honestly, on real numbers, every time. It
cannot recognise a person, a building, or a vehicle as an object; a smooth,
pale, low-texture wall can score similarly to pale, dry, ashy soil, because
colour statistics alone genuinely can't tell them apart (verified at ~78%
confidence in testing — `BUILD_LOG.md` §8). `VALIDATION_SYSTEM_PROMPT.md`
Part B is the full, rule-by-rule honesty table: what's implemented, what's
approximated, and what would need a real trained model.

This felt truer to the spirit of what you sent me than pretending a
150-line TypeScript file can do object recognition. The alternative — a
confident-sounding rule pretending to detect "buildings" that actually
just fires on any pale, low-contrast image — is exactly the kind of thing
your own spec explicitly rules out.

## Testing

Full detail and exact numbers are in `BUILD_LOG.md` §8. Summary: pure-logic
unit tests against synthetic fixtures (including the real bundled sample
image run through the exact same code path the app uses — 87% confidence,
correctly proceeds), `tsc`/`lint`/`next build` all clean, and a full
real-Chrome (Playwright) pass against the actual production build —
sample analysis, a real soil photo upload, sky/grass/overexposed/tiny
uploads all correctly rejected with the right reasons, an ambiguous photo
correctly landing Uncertain, and a reject-then-recover flow — all passing,
desktop and mobile viewports, zero console errors beyond the same
sandbox-only Google Fonts limitation already documented in `BUILD_LOG.md`
§6.
