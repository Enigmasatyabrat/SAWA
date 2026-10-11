# PUB-SAWA-001
# Public Surface — claims audit, wording rules, publication strategy

---

## Document Control

| Field | Value |
|---|---|
| Document ID | PUB-SAWA-001 |
| Version | 1.0.0 |
| Status | Audit complete; copy changes **proposed, not applied** — they depend on the owner accepting ADR-009 |
| Created | 11 October 2026 |
| Depends on | ADR-009, ADR-020, VAL-SAWA-001 §4 |

---

## 1. Rules

1. Say what the system does, not what it hopes to do. ("Estimated from colour,
   not a lab test" beats "AI-powered soil intelligence" — v1.0 CLAUDE.md.)
2. No accuracy number without a passed VAL study ID (ADR-020).
3. Literature numbers only as "published studies elsewhere report …".
4. Name sources for agronomy (SP-004): "ICAR STCR equation, RAU Pusa".
5. Heuristic, estimate and measurement are different words — use the right one.

---

## 2. Claims audit of the current site (verified by reading the source)

| # | Where | Current text | Problem | Proposed (after ADR-009) |
|---|---|---|---|---|
| P-1 | `src/app/page.tsx` hero | "Photograph the soil. **SAWA reads its nutrients.** You learn what to plant." | A photo cannot read available N/P/K (L-10 – L-12); today the values are a darkness heuristic plus random noise | "Photograph the soil. Enter your Soil Health Card. **Get a fertiliser plan you can trust.**" — or, for the current demo: "SAWA **estimates** a soil profile from colour — a prototype, not a lab test." |
| P-2 | `src/app/layout.tsx` meta description | "SAWA reads its nutrients and tells you what to plant …" | Same as P-1; this is what search engines show | Mirror P-1 |
| P-3 | `src/app/page.tsx` stat card | "4 — Signals predicted — pH, Nitrogen, Phosphorus, Potassium" | "Predicted" implies a model | "4 — Signals estimated by a heuristic" (v2) → "12 — Soil Health Card parameters understood" (v3) |
| P-4 | `src/app/page.tsx` card 03 | "… returning up to eight crops **actually suited** to that soil" | Suitability is computed from heuristic nutrients; "actually" overstates. *Since PR #12 the filter itself is correct.* | "… crops whose pH and nutrient needs match the estimated profile" |
| P-5 | `src/app/contact/page.tsx` FAQ | "… a heuristic model built on **colour-to-property correlations from soil science literature** …" | Only the darkness → organic-carbon link has literature support (L-09); the N/P/K formulas and their random noise do not | "… a hand-tuned rule based on how dark the soil looks. Darker soils do tend to hold more organic carbon, but the N, P and K numbers are rough guesses, not measurements." |
| P-6 | `src/components/AnalyzerClient.tsx` empty crops | "… part of why the model keeps improving." | There is no model | **Fixed in PR #12** |
| ✓ | `src/app/about/page.tsx` | "The heuristic nutrient model is a starting point, not a finish line …" | Honest | Keep |
| ✓ | Analyzer result footnote | "… not independently lab-verified." | Honest | Keep |

P-1 – P-5 are positioning decisions, so they are listed here for sign-off rather
than changed silently. They are small text edits once ADR-009 is accepted
(IMP P3.6).

---

## 3. Publication and portfolio strategy

| Output | When | Why it's credible |
|---|---|---|
| **Portfolio** (current site + README) | Now | Honest limitations are a strength with examiners and recruiters — keep the tone |
| **Technical write-up**: "Verified transcription of ICAR STCR equations as tested software" | After P2 | Novelty is engineering rigour: reproducing published reckoners in unit tests (SV-004) |
| **Open dataset**: Gorakhpur phone-photo + SHC-method lab pairs with grey card | After P3 (consent permitting, coordinates coarsened) | No equivalent public dataset was found for eastern UP (D-confidence — searched GitHub only) |
| **Paper**: phone-read soil colorimetry vs SHC lab methods (SV-005) | After P4 | Directly comparable to L-30 – L-32; a negative result is also publishable |
| **Software paper** (e.g. JOSS) | When tests and docs mature | Open, tested, documented tool |

Do not publish before the corresponding VAL study, and never with numbers
from the heuristic.
