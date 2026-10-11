# SAWA-REC — SAWA Research & Engineering Corpus
# MASTER INDEX v2.0.0

---

## What this is

The research and engineering documentation for **SAWA** — built by Satyabrat
Mishra (B.Tech CSE, AI/ML, ITM GIDA, Gorakhpur). Same document-ID scheme as
the `WG-REC` corpus for Water Guardian, one document per concern.

**v2.0.0 (11 October 2026)** turns the v1.0 registry's `PLANNED` rows into
written documents and adds two new document types the project now needs:
**HW** (the phone-attached instrument) and **BIZ** (the business model).
v1.0 is archived unchanged at
[`docs/archive/v1.0/SAWA-REC-INDEX-v1.0.md`](archive/v1.0/SAWA-REC-INDEX-v1.0.md).

**Status of the product:** SAWA v2 (this repo's Next.js app) is a working,
honest **demonstrator** — the blueprint. This corpus specifies v3, the real
architecture.

---

## The plan on one page

1. **A phone photo can't read nitrogen, phosphorus or potassium** — the
   literature is consistent on this (LIT L-10 – L-12). It *can* estimate organic
   carbon and describe colour and moisture, if calibrated and trained locally
   (L-01 – L-09). → Stop presenting photo-derived N/P/K as measurements (ADR-009).
2. **India already measures soil at scale** — 25 crore Soil Health Cards in a
   fixed 12-parameter format (L-13 – L-16). → Use SHC units and bands as
   canonical (ADR-010), and turn the card a farmer already has into a plan.
3. **Fertiliser advice is solved science** — ICAR STCR equations, verified here
   against ICAR's own tables (L-21 – L-24). → Deterministic, cited, unit-tested
   advice: the first release needs no ML at all (ADR-011, IMP P2).
4. **The phone can be the lab instrument** — reagent chemistry read by the
   camera (HW-0, ~₹200–500) or a ₹1.5–3.7k USB-C/BLE dongle (HW-1), versus
   ₹50k–1.17 lakh for today's readers (L-29 – L-32, ADR-015).
5. **The customer is the lab, not only the farmer** — 2025's Village-Level
   Soil Testing Lab grant (₹1.5 lakh per lab) funds exactly the people who need
   a cheap instrument and SHC-format software (BIZ §5).
6. **Nothing claims accuracy until a pre-registered study passes** (ADR-020, VAL).

---

## How to read this

| You are … | Read |
|---|---|
| Starting work in a new session | REV-SAWA-001 (state, findings, open decisions) → IMP-SAWA-001 "Next 10 sessions" |
| Checking *why* something was decided | ADR-SAWA-001 (ADR-001 … 008), ADR-SAWA-002 (ADR-009 … 020) |
| Checking whether a claim is true | LIT-SAWA-001 — every evidence item has an ID, a source and a confidence grade |
| Building the hardware | HW-SAWA-001 |
| Pitching or applying for a grant | BIZ-SAWA-001, then VAL-SAWA-001 for what you may claim |

---

## Confidence scale (used in every document)

| Grade | Meaning |
|---|---|
| **A** | Verified by execution in this repo, or read directly from a primary source |
| **B** | Corroborated by ≥ 2 independent credible sources |
| **C** | One credible source |
| **D** | Inference or estimate — must be validated before money or claims depend on it |

---

## Document registry

| ID | Title | Status | Weakest grade inside |
|---|---|---|---|
| **SAWA-REC-INDEX** | This index | Written v2.0.0 | — |
| **REV-SAWA-001** | Blueprint audit, findings, confidence register, cleanup manifest | Written | A–B (audit facts were executed) |
| **ADR-SAWA-001** | Decisions batch 1: ADR-001 … 008 (from v1.0, with dated updates) | Written | A (fixes re-verified) |
| **ADR-SAWA-002** | Decisions batch 2: ADR-009 … 021 | Written — **Proposed, awaiting sign-off** | B |
| **LIT-SAWA-001** | Literature & evidence review (L-01 … L-40) | Written | C on single-source studies |
| **DATA-SAWA-001** | Datasets, schema changes, licences, consent | Written | D on SHC access terms |
| **AI-SAWA-001** | Models vs maths vs lookups; evaluation protocol | Written | B |
| **SYS-SAWA-001** | v3 target architecture and data model | Written | B |
| **API-SAWA-001** | v3 API surface (v2 stays in `/API.md`) | Written | A (worked example matches ICAR table) |
| **VAL-SAWA-001** | Pre-registered validation studies SV-001 … 008 | Written | — (criteria, not claims) |
| **HW-SAWA-001** | Phone-attached instrument: HW-0 cradle, HW-1 dongle | Written | **D on BOM prices and regulation** |
| **BIZ-SAWA-001** | Market, competitors, revenue model, GTM, funding | Written | **D on prices and volumes** |
| **IMP-SAWA-001** | Roadmap P0 … P7 with exit criteria | Written | D on durations |
| **PUB-SAWA-001** | Claims audit of the site, publication plan | Written | A (audit read from source) |
| `PHASE-1A-CAPTURE-PROTOCOL` | Field capture protocol (amended: grey card) | Written | — |
| `archive/v1.0/*` | v1.0 index, roadmap, prompts, git guide, learning pathway, CLAUDE/README | Archived | — |
| `../design/*` | Design spec and clickable prototype | Draft (separate session) | — |

---

## Architecture principles

SP-001 … SP-009 from v1.0 stand unchanged (see the archived index). Added:

| ID | Principle |
|---|---|
| SP-010 | **Measure, don't infer.** A nutrient value is shown as a measurement only if it came from a measurement (card, lab, kit, sensor). |
| SP-011 | **Indian units are canonical.** SHC units, methods and bands; record what was received, convert on read. |
| SP-012 | **Every number has a source ID** — an evidence ID, an equation's page, a dataset hash or a validation study. |
| SP-013 | **Offline first.** Anything a farmer needs in the field works without a connection. |
| SP-014 | **Licence before merge.** No licence file means reference only (ADR-017). |
| SP-015 | **Hardware is optional.** The app must be useful with no device at all; hardware adds measurements, not the whole product. |

---

## Implementation entry point

**IMP-SAWA-001 → "Next 10 working sessions".** Open decisions that only the
owner can make are listed in **REV-SAWA-001 §5**.
