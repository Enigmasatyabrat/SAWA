# VAL-SAWA-001
# Validation Specification — how SAWA earns the right to show a number

---

## Document Control

| Field | Value |
|---|---|
| Document ID | VAL-SAWA-001 |
| Version | 1.0.0 |
| Status | Written (listed PLANNED in v1.0 INDEX). No study has run yet except where marked. |
| Created | 11 October 2026 |
| Depends on | ADR-020 (no claim without a passed study), AI-SAWA-001 §4, HW-SAWA-001 §9 |

---

## 1. Rules for every study

1. **Pre-register** the acceptance criteria in this file *before* collecting data.
   Changing them afterwards requires a dated note explaining why.
2. **Report everything**: n, dates, phones, villages, failures and exclusions —
   not only the headline metric.
3. **Confidence intervals** on every metric (bootstrap, 1,000 resamples).
4. **The result decides the feature.** A failed study means the feature does not
   ship, or ships with the claim removed. That outcome is recorded, not hidden.
5. Each passed study gets an ID that UI copy links to (ADR-020).

---

## 2. Study register

| ID | Question | Design | Acceptance | Status |
|---|---|---|---|---|
| **SV-001** | Can one person run the Phase 1A protocol reliably? | 20 samples (D-01), Phase 1A protocol + grey card | ≥ 18/20 samples with all metadata, sharp photos, card visible, lab IDs returned | Tooling ready; collection not started |
| **SV-002** | How repeatable is phone colour? | 10 soils × 3 shots × 2+ phones, with and without card | Card-corrected within-sample ΔE₂₀₀₀ ≤ 2; cross-phone ΔE₂₀₀₀ reduced ≥ 50 % by card correction | Proposed |
| **SV-003** | Does colour predict OC rating class locally? (M-2) | ≥ 150 lab-paired samples; grouped + spatial + phone hold-out (AI §4) | Macro-F1 **above both baselines** (majority class; district median) with non-overlapping 95 % CIs; 90 % conformal coverage achieved on held-out districts | Proposed — blocked on D-03 |
| **SV-004** | Is every encoded STCR equation transcribed correctly? | Unit test per equation reproducing its published ready-reckoner table | **100 %** of printed rows within ±1 kg/ha | **Passed for 1 equation** (Pusa wheat, young alluvium calcareous) — L-23; formal test to be committed with the advisor code |
| **SV-005** | Does HW-0/HW-1 agree with the lab? | 30–50 soils spanning Low/Med/High per nutrient; same extract read by SAWA and by the partner lab's SHC method | Rating-class agreement **≥ 85 %** for P and K and **≥ 75 %** for N-class (vs the visual-kit 61/83/81 % baseline, L-31); bias and precision reported | Proposed |
| **SV-006** | Can target users use it? | ≥ 10 farmers + ≥ 3 lab operators, Hindi UI, observed tasks | ≥ 80 % complete card-to-plan unaided; median time ≤ 5 min; plans checked by an agronomist with no unsafe dose | Proposed |
| **SV-007** | Do plans work in the field? | STCR plans on ≥ 10 farmer plots vs farmer practice | Yield within ±10 % of target on ≥ 70 % of plots (the STCR validity criterion, L-25) | Proposed — a full season |
| **SV-008** | Crop-health model on field photos (M-4) | Field-only test set, per crop | Report field accuracy and abstention rate; ship only where it beats a "consult the KVK" default on recall for the top diseases | Deferred (Phase 6) |

---

## 3. Already verified this session (A-grade evidence, not studies)

| Item | What was run | Result |
|---|---|---|
| Crop filter fix (ADR-002) | 6,696 swept inputs + 20 noise draws per colour through the real pipeline | 0 rule violations; only false positives removed; Sandy empty-rate 0.2 % → 54.4 % (ADR-008 gap) |
| Canvas reflow fix (ADR-007) | Instrumented `getBoundingClientRect` in a real browser | 0 calls per second of animation; resize re-measures correctly |
| STCR transcription | Pusa wheat equations vs compendium reckoner | Matches at all checked rows within ±1 kg/ha |
| Manifest CSV parsing | Multi-line quoted notes, `#`-leading continuation lines | Fields preserved; comment rows still skipped |

These are engineering checks, not accuracy claims about soil.

---

## 4. What may be said publicly, and when

| Before … passes | Allowed wording | Not allowed |
|---|---|---|
| SV-003 | "SAWA describes your soil's colour (Munsell) and moisture." | Any OC accuracy, "AI reads your soil" |
| SV-005 | "Uses the same chemistry as standard soil test kits." | "Lab-accurate", "lab-equivalent" |
| SV-006 | "Designed with farmers in Gorakhpur." | "Farmer-tested" |
| SV-007 | "Fertiliser plans use ICAR STCR equations." | "Increases yield by X %" |

PUB-SAWA-001 applies these rules to the existing site.
