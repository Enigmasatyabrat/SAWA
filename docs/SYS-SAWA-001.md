# SYS-SAWA-001
# System Specification — SAWA v3 target architecture

---

## Document Control

| Field | Value |
|---|---|
| Document ID | SYS-SAWA-001 |
| Version | 1.0.0 |
| Status | Target design — v2 (as built) is the blueprint, v3 is this document |
| Created | 11 October 2026 |
| Depends on | ADR-009 … ADR-020, AI-SAWA-001, DATA-SAWA-001, HW-SAWA-001 |

---

## 1. Where v2 stands (verified 11 Oct 2026)

| Area | v2 reality | Evidence |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript, Tailwind v4 | `package.json` |
| Analysis | K-Means + RGB thresholds + darkness heuristic with gaussian noise | `src/lib/soil-engine.ts` |
| API | `POST /api/analyze-soil`, `GET /api/test-db` | `API.md`; exercised end to end, 200 OK |
| Validation gate | Client-side only; bypassable | RELEASES.md known limitations |
| Storage | MongoDB Atlas — **cluster no longer resolves (NXDOMAIN)**; app degrades gracefully | `nslookup` via 8.8.8.8, 11 Oct 2026 |
| CI | GitHub Actions lint + typecheck + build: passing | PR #12 |
| Deploy | Vercel project `sawa-soil-analyzer`: **every deployment failing** since it was connected | commit statuses on `main` |
| Units | "ppm" with non-standard thresholds | ADR-010 |

v2 is a working, honest **demonstrator**. v3 keeps its stack and its good
habits (shared engine module, graceful storage failure, client gate) and
replaces its core.

---

## 2. Target architecture

```
┌──────────────────────────── Phone (PWA, offline-first) ────────────────────────────┐
│  Capture guide ─► Quality gate (M-1) ─► Card detect + colour correction (C-3)       │
│        │                                   └─► Munsell (C-4), OC class (M-2, ONNX)  │
│  SHC entry / scan ─────────────────────────────┐                                    │
│  Kit reader (HW-0 camera) / Probe (HW-1 WebUSB/BLE) ─► Colorimetry (C-5)            │
│        │                                       ▼                                    │
│        └──────────────► Measurements (with provenance) ─► Advisor (C-1, C-2)        │
│                                 │  IndexedDB store + sync queue                     │
└─────────────────────────────────┼───────────────────────────────────────────────────┘
                                  │ HTTPS (sync when online)
┌─────────────────────────────────▼──────────── Server (Next.js route handlers) ─────┐
│  Auth (phone OTP) · Sync API · Advisor API (same C-1/C-2 module as the device)      │
│  Region API (C-6 aggregates) · Lab-partner batch API · Model/equation registry      │
└───────────────┬───────────────────────────────┬────────────────────────────────────┘
                ▼                               ▼
     PostgreSQL + PostGIS               Object storage (consented images,
     (ADR-013)                          SHA-256 keyed; never public)
                ▲
     ml/ Python workspace (offline) ─► ONNX models + model cards ─► registry
```

**Design rule carried from v2:** the advisor and conversion code is one
TypeScript module imported by both the device and the server — the same rule
that already keeps `soil-engine.ts` from drifting between UI and API.

---

## 3. Data model

The central idea: **a number is meaningless without where it came from.** Every
measurement stores its provenance, so the UI can always say "from your Soil
Health Card", "from SAWA kit, batch 12", or "estimated from photo".

| Table | Key columns | Notes |
|---|---|---|
| `person` | id, phone_hash, language, created_at | Minimal PII (DATA §6) |
| `consent` | id, person_id, scope (`advice` / `research`), version, granted_at, revoked_at | Separate research consent |
| `field` | id, person_id, name, geom (PostGIS, coarsened server-side), district_code, area_ha | Precise location stays on device unless research consent |
| `sample` | id, field_id, collected_at, depth_cm, collector, lab_partner_id? | Physical soil sample |
| **`measurement`** | id, sample_id, **parameter** (enum of the 12 SHC parameters + `moisture`, `munsell`), **value**, **unit_as_received**, **value_canonical**, **source** (`shc_card`, `lab`, `kit`, `probe`, `camera_model`), **method** (e.g. `Olsen`, `KMnO4`, `Griess-Zn`), instrument_or_model_version, reagent_batch_id?, confidence (interval or class set), created_at | **The core of v3** |
| `image` | id, sample_id, sha256, phone_model, card_detected, quality_verdict, consent_id | Bytes in object storage |
| `rating_band` | parameter, scheme (`SHC`, `TNAU`), low_max, high_min, unit, source_ref | Data, not code (ADR-010) |
| `stcr_equation` | id, crop, centre, soil, valid_districts[], target_min/max, coefficients, maintenance_min, method_units, quality_flag, source_page | Each row has a reckoner test (VAL SV-004) |
| `crop_requirement` | crop, ph_min/max, n/p/k band, source_ref | Rebuilt with citations — fixes ADR-008 |
| `advice` | id, sample_id, crop, yield_target_q_ha, equation_id, doses (N, P₂O₅, K₂O kg/ha), product_plan (urea/DAP/MOP), disclosures[], created_at | Reproducible from inputs |
| `device` / `reagent_batch` | serial, firmware / batch id, calibration curve, expiry | HW provenance |

---

## 4. Key flows

**F-1 — Card to plan (no ML; v3 first release).** Farmer enters 12 SHC values
(or photographs the card → on-device OCR → farmer confirms each field) →
canonical units → ratings → farmer picks crop and yield target → STCR equation
selected (ADR-011 order) → doses in N/P₂O₅/K₂O → converted to fertiliser
products and bags → Hindi plan with disclosures ("equation from RAU Pusa,
nearest validated centre").

**F-2 — Photo to soil description.** Capture with card → quality gate →
colour correction → Munsell + moisture + OC class (only once M-2 passes
VAL SV-003) → stored as `camera_model` measurements, clearly labelled.

**F-3 — Kit or probe to measurement.** App walks the user through extraction
with timers → HW-0 photo of blank/standard/sample or HW-1 reading → C-5 →
`kit`/`probe` measurements with batch and calibration → can feed F-1.

**F-4 — Lab partner batch.** VLSTL/KVK registers samples, photographs each
before analysis, uploads lab results → SHC-format report for the farmer, and a
consented D-03 row for SAWA.

---

## 5. Offline and sync

- All of F-1 and F-2 run offline; the advisor tables (bands, equations,
  crop requirements) ship with the app and update on sync.
- Writes go to an IndexedDB outbox; sync is append-only for measurements
  (they are facts with timestamps — no edit conflicts). Edits to fields and
  people use last-writer-wins with a server timestamp.
- Models and equation tables are versioned; each advice record stores the
  versions it used, so an old plan can be explained after an update.

---

## 6. Security and privacy

- Phone-OTP auth; no passwords.
- Server stores `phone_hash`, not plain numbers, where possible.
- Research-consented images are never served publicly; any public dataset
  release follows DATA-SAWA-001 §6.
- The server re-runs the image gate (ADR-019) and validates every unit and
  range — the client is not trusted.
- Secrets only in environment variables; `.env*` stays gitignored.

---

## 7. Internationalisation and accessibility

- Message catalogues from day one; Hindi first, then Bhojpuri and others as
  field tests demand.
- Numbers always shown with units; ratings also shown as words and colours
  (not colour alone).
- Voice read-out of the plan for low-literacy users is a strong candidate for
  the field test (VAL SV-006).

---

## 8. Deployment and operations

| Concern | Plan |
|---|---|
| Hosting | Fix the Vercel project first (likely a stale static-export output setting — HYPOTHESIS, see REV-SAWA-001 §3) or move to any Node host |
| Database | Managed Postgres + PostGIS free tier |
| Observability | Request logging with no PII; error tracking; counters for abstentions and gate rejections (a rising rate flags a new phone or lighting problem) |
| CI | Existing lint/typecheck/build + unit tests for C-1/C-2 (incl. every STCR reckoner) + `ml/` tests in a separate job |
| Dependencies | Triage the 10 open Dependabot PRs; never auto-merge a Next.js major/minor without reading `node_modules/next/dist/docs/` (AGENTS.md) |

---

## 9. Migration path from v2

1. Keep `/api/analyze-soil` as the labelled legacy demo (ADR-009).
2. Add the C-1/C-2 module + tests; ship F-1 behind a new `/plan` route.
3. Swap MongoDB for Postgres; the two v2 routes are the only consumers.
4. Move the gate server-side (ADR-019).
5. Add Munsell (C-4) to the existing result view — labelled uncalibrated.
6. Ship F-2/F-3 as their validation studies pass.
