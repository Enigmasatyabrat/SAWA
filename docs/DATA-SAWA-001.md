# DATA-SAWA-001
# Data Specification — what SAWA collects, borrows, and is allowed to use

---

## Document Control

| Field | Value |
|---|---|
| Document ID | DATA-SAWA-001 |
| Version | 1.0.0 |
| Status | Written (v1.0 INDEX listed this as PLANNED and "blocks everything in Phase 2") |
| Created | 11 October 2026 |
| Depends on | LIT-SAWA-001, ADR-010, ADR-017, `data/phase-1a/`, `docs/PHASE-1A-CAPTURE-PROTOCOL.md` |

---

## 1. Principles

1. **Lab-paired or it isn't training data.** A photo without a lab result is
   unlabelled; a heuristic output is never a label (SP-001, SP-002).
2. **Record what the lab reported, in the unit it reported, by the method it
   used.** Convert on read, never on write (ADR-010).
3. **Every row is traceable** to an image hash, a sample bag, a lab ID and a
   consent record.
4. **Licence before use** (ADR-017). Each external source below carries its
   licence and permitted use.

---

## 2. Internal datasets

| ID | Dataset | Status | Purpose |
|---|---|---|---|
| D-01 | `data/phase-1a/` — 20-sample pilot: photos + EXIF + field checklist | Tooling done, **collection not started** | Feasibility: protocol compliance, repeatability, lab turnaround |
| D-02 | `data/samples/manifest.csv` — older 50–100-sample training manifest | Empty | Superseded by D-03 for v3 work; kept for history |
| D-03 | **Lab-paired soil set** (v3) — photos with reference card + SHC-method lab results | Proposed | OC-class model (AI M3), moisture model (M4), kit calibration (HW SV-005) |
| D-04 | Kit / probe readings paired with lab results | Proposed | HW-0/HW-1 calibration and validation |
| D-05 | Farmer-entered SHC values (with consent) | Proposed | Advisory history; anonymised district statistics |

### 2.1 Required changes to the Phase 1A schema — before any lab data exists

Phase 1A's lab columns are named `nutrient_n_ppm_later`, `nutrient_p_ppm_later`,
`nutrient_k_ppm_later`. Soil Health Card labs report **kg/ha** (and sometimes
P₂O₅ / K₂O, L-15). Converting ppm ↔ kg/ha depends on bulk density and sampling
depth, so assuming one would quietly bake an error into the labels. No lab data
has been collected yet, so the fix costs nothing today:

| Add / change | Why |
|---|---|
| Rename `nutrient_{n,p,k}_ppm_later` → `lab_{n,p,k}_value_later` | Unit-neutral |
| Add `lab_{n,p,k}_unit_later` (e.g. `kg/ha`, `kg P2O5/ha`, `ppm`) | Record exactly what was printed |
| Add `lab_{n,p,k,oc}_method_later` (e.g. `KMnO4`, `Olsen`, `NH4OAc`, `Walkley-Black`) | Methods change the quantity (L-16) |
| Add `reference_card_in_frame` (Y/N) | Calibration is decisive for transfer (L-05, L-07) |
| Keep `oc_percent_later` | OC is the parameter colour can actually predict (L-01) |

This is a **Phase 1B task** (IMP-SAWA-001), deliberately not done in this
documentation PR so the schema change gets its own reviewed commit with the
scripts updated alongside it.

### 2.2 Capture protocol amendment (applied in this PR)

`docs/PHASE-1A-CAPTURE-PROTOCOL.md` originally said *do not buy a colour card*.
The evidence says a reference in frame is what makes phone colour transfer
across devices (L-05, L-07). Amended: place an **18 % neutral grey card** (₹20–50)
at the edge of the frame in every shot. It doesn't change the rest of the
protocol, and without it the 20 pilot photos can't be colour-corrected later.

---

## 3. Sample-size reasoning

| Purpose | Minimum n | Basis | Conf. |
|---|---|---|---|
| Pilot feasibility (D-01) | 20 | Protocol and logistics only — **no accuracy claims at this n** | A (policy) |
| First OC-class model (M3) | ≥ 150 lab-paired | Published phone studies used 70 (L-05) to 611 (L-03); 150 allows grouped CV with a usable test fold | C |
| District-level credibility | ≥ 300, ≥ 3 villages per soil type | Regional transfer fails (L-08) — stratify | C |
| HW-0 chemistry validation (SV-005) | 30–50 soils spanning Low/Med/High per nutrient | Class-agreement studies (L-31) | C |

### 3.1 The cheapest path to D-03: partner with labs that already test soil

Every Village-Level Soil Testing Lab, KVK and school soil lab (BIZ §2) already
receives physical samples and produces SHC-method results. Photographing each
sample **before** it is analysed — with consent — creates lab-paired data with
no extra lab cost. This makes labs SAWA's data partners and its first
customers at the same time.

---

## 4. External sources

| ID | Source | Content | Licence / terms | Permitted use | Conf. |
|---|---|---|---|---|---|
| X-01 | Soil Health Card portal ([soilhealth.dac.gov.in](https://soilhealth.dac.gov.in)) | Cards: 12 parameters, GPS, recommendations | Government portal; **terms for automated access not reviewed** | Farmer enters or scans **their own** card (consent); **no bulk scraping until terms are checked** | D |
| X-02 | [`google-research-datasets/india-soil-health-card`](https://github.com/google-research-datasets/india-soil-health-card) | Scraper, `card.proto`, reliability-scoring R scripts | Apache-2.0 | Schema alignment; method reference | A |
| X-03 | ICAR-IISS *Four Decades of STCR Research* compendium | Fertiliser prescription equations + reckoners | Government publication | Transcribe equations as data with page refs (ADR-011, ADR-017 §5) | A |
| X-04 | SoilGrids 250 m (ISRIC) | Global gridded soil properties | CC-BY 4.0 (to confirm at use) | Background context only — OC disagrees > 2× with SHC in most of India (L-18) | B |
| X-05 | Open Soil Spectral Library | Vis-NIR/MIR spectra + lab data | Open (per dataset) | Only if the NIR path is pursued | C |
| X-06 | [PlantDoc](https://github.com/pratikkayal/PlantDoc-Dataset) | Field plant-disease images | CC-BY-4.0 | Phase 6 crop-health training, attribution required | A |
| X-07 | Crop requirement references (ICAR crop institutes, package-of-practices) | pH and nutrient requirements per crop | Government / university publications | Rebuild the crop table with a citation per row — fixes ADR-008 | C |

---

## 5. Storage, versioning, provenance

- **Images:** never in git (`.gitignore` already excludes `data/phase-1a/raw/*`).
  Stored in object storage with SHA-256 names; the manifest references the hash.
- **Manifests:** CSV in git — small, diffable, reviewable.
- **Dataset versions:** a dataset release = a manifest commit + a content hash
  of the referenced images. Every model card cites the release (AI-SAWA-001 §5).
- **Measurements in the product:** every value carries
  `{source: lab|shc_card|kit|probe|camera_model, method, unit_as_received, instrument_or_model_version, confidence}`
  (SYS-SAWA-001 §3).

---

## 6. Privacy and consent

Farmers' names, phone numbers and **field GPS** are personal data under India's
Digital Personal Data Protection Act, 2023.

| Rule | Implementation |
|---|---|
| Consent before collection, in the user's language | Consent screen + record (`consent_id`, version, timestamp) before any photo or card is stored server-side |
| Purpose limitation | Advice by default; research use is a **separate, optional** consent |
| Minimisation | Store field location at full precision only on the device; server copies coarsened unless research consent is given |
| Public release | Coordinates truncated to 2 decimals (~1 km) or dropped (already the Phase 1A README rule) |
| Deletion | User can delete their data; derived anonymised aggregates are retained |
| Images | EXIF stripped before upload unless research consent is given |
