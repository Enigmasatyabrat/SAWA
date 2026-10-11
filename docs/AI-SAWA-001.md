# AI-SAWA-001
# Machine Learning & Computation Specification

---

## Document Control

| Field | Value |
|---|---|
| Document ID | AI-SAWA-001 |
| Version | 1.0.0 |
| Status | Written (listed PLANNED in v1.0 INDEX) — **no model exists yet; none may be trained before D-03 data exists** (SP-001, ADR-SAWA-001 ADR-003) |
| Created | 11 October 2026 |
| Depends on | LIT-SAWA-001, DATA-SAWA-001, ADR-009, ADR-011, ADR-014, ADR-020 |

---

## 1. The honest map: what is ML, what is maths, what is a lookup

Most of SAWA's value in v3 needs **no machine learning at all**. Calling
deterministic science "AI" is the overclaim this project has already
corrected once.

| ID | Component | Kind | Needs training data? | Status |
|---|---|---|---|---|
| C-1 | Unit conversion + SHC rating bands | Lookup / arithmetic | No | Specify now (ADR-010) |
| C-2 | STCR fertiliser advisor | Published equations | No — but needs reckoner tests (SV-004) | Specify now (ADR-011) |
| C-3 | Colour calibration from grey card / reference patches | Classical colour science | No | Phase 3 |
| C-4 | Munsell notation | Colour-space conversion (`munsell` npm, MPL-2.0) | No | **Can ship now**, labelled "uncalibrated" until C-3 |
| C-5 | Reagent colorimetry (HW-0/HW-1) | Beer–Lambert with in-run standards | Calibration curves, not ML | Phase 4 |
| C-6 | Regional context ("typical for your district") | Descriptive statistics on consented SHC data | Aggregates, not ML | Phase 2–3 |
| **M-1** | Soil-image quality / "is this soil?" gate | ML classifier (replaces today's heuristic gate) | Yes — modest | Phase 3 |
| **M-2** | Organic-carbon rating class (Low / Med / High) from calibrated colour | ML (tabular first) | **Yes — D-03, ≥ 150 lab-paired** | Phase 3 |
| **M-3** | Visual moisture class | ML | Yes | Phase 3 |
| **M-4** | Crop disease / deficiency | Deep learning (transfer) | Yes — field images | Phase 6 (ADR-016) |
| ~~M-x~~ | ~~Available N/P/K from a photo~~ | — | — | **Not built** (ADR-009) |

---

## 2. Model specifications

### M-1 — Image quality gate
- **Input:** downscaled image; capture metadata.
- **Output:** `{usable: bool, reasons[], soil_probability}`.
- **Method:** start by keeping the current pixel-statistics gate
  (`src/lib/image-validation.ts`) and logging its decisions; train a small
  classifier (logistic regression on the same statistics, then a tiny CNN) only
  once ≥ 500 labelled accept/reject examples exist.
- **Runs:** client (instant feedback) **and** server (ADR-019).

### M-2 — Organic-carbon class
- **Target:** SHC OC band (L-15): Low < 0.5 %, Medium 0.5–0.75 %, High > 0.75 %;
  regression on OC % trained alongside, reported as an interval.
- **Features:** grey-card-corrected CIELab means and percentiles of the soil
  region; Munsell value/chroma; texture statistics; recorded moisture class;
  phone model as a categorical feature (L-05). Topography optional later (L-04).
- **Method:** Random Forest / gradient boosting first (SP-005, ADR-SAWA-001 ADR-003).
- **Baselines it must beat:** (a) majority class; (b) the **district median OC**
  from consented SHC data (C-6). A colour model that cannot beat "typical for
  your district" adds nothing and is not shipped.
- **Literature expectation, not a target:** published phone studies report
  R² 0.58–0.88 under controlled conditions (L-01); the only Indo-Gangetic one
  reports 0.58 (L-03). Expect the low end on uncontrolled field capture.

### M-3 — Moisture class
- **Why:** moisture is the largest confounder of colour-based OC (L-06); the
  model needs it as an input, and it is useful to the farmer on its own.
- **Labels:** Phase 1A `moisture_visual` as a weak label; gravimetric moisture
  on a subset for the true label.

### M-4 — Crop health (later)
- **Rules from ADR-016:** field images only for evaluation; PlantDoc
  (CC-BY-4.0) plus consented SAWA images; open-set abstention; per-crop models;
  never trained on PlantVillage alone (L-34).

---

## 3. Uncertainty — every output is an interval or a set

- **Classes:** split-conformal prediction gives a *set* of plausible classes
  at a chosen coverage (e.g. 90 %). If the set has more than one class, the UI
  says "Low or Medium" rather than picking one.
- **Abstention:** if the image gate fails, the card isn't detected, or the
  conformal set is all classes, the answer is "can't tell from this photo",
  with the reason.
- **Provenance:** each result records model version, dataset release hash, and
  calibration applied (DATA-SAWA-001 §5).

---

## 4. Evaluation protocol (prevents fooling ourselves)

| Rule | Why |
|---|---|
| **Grouped CV by field/farm**, never by photo | Three shots of one sample are near-duplicates; random splits leak |
| **Spatial hold-out**: at least one village/district never seen in training | Regional transfer is where phone models fail (L-08) |
| **Phone hold-out**: at least one phone model never seen in training | Cross-device colour shift (L-05) |
| Report class accuracy, macro-F1, per-class recall, conformal coverage, confusion matrix — with bootstrap CIs | Single accuracy numbers on small n mislead |
| Compare against both baselines in §2 | A model must earn its place |
| Freeze the test set before any tuning | Standard, but stated because it is the most commonly broken rule |

Acceptance thresholds per study are defined in VAL-SAWA-001.

---

## 5. Pipeline and artefacts

```
ml/                              (new Python workspace — separate from the Next.js app)
  data/       → manifests only (images in object storage, referenced by SHA-256)
  features/   → colour calibration, CIELab/Munsell, texture
  train/      → sklearn / LightGBM; PyTorch only for M-4
  eval/       → grouped + spatial + phone hold-out reports
  export/     → ONNX + model card
```

- **Model card** (required to ship): intended use, data release hash, n by
  class and district, all §4 metrics with CIs, known failure modes, date, owner.
- **Serving:** ONNX Runtime Web on device (ADR-014); same file server-side as
  fallback. The existing `src/lib/ml/features.ts` stays as the TypeScript
  feature extractor so training and serving share one definition — features
  computed differently in two places is a classic silent bug.
- **Retraining trigger:** a new dataset release, or monitoring showing
  grey-card residuals drifting (a new phone model in the field).

---

## 6. Language models (if used at all)

An LLM may **phrase** results in Hindi or English. It may not produce a number,
a dose, a rating, or a recommendation. Advice text is generated from templates
filled with C-1/C-2 outputs first; an LLM is only a later readability layer
over that fixed content, with the numbers inserted after generation and a check
that the output contains no digits the template didn't supply. Until then:
templates only.

---

## 7. What would change this plan

- If D-03 shows OC is unpredictable from calibrated colour on local soils
  (M-2 can't beat the district baseline), the camera path reduces to quality
  gate + Munsell + moisture, and the product leans fully on C-2 and C-5. That
  is still a complete product.
- If a NIR path is funded (HW §8), total N and OC models move to spectra, with
  OSSL as pre-training data (DATA X-05).
