# ADR-SAWA-002
# SAWA Architecture Decision Records — Batch 2: from blueprint to product (ADR-009 … ADR-020)

---

## Document Control

| Field | Value |
|---|---|
| Document ID | ADR-SAWA-002 |
| Version | 1.0.0 |
| Status | Proposed — awaiting owner sign-off (see REV-SAWA-001 §5) |
| Created | 11 October 2026 |
| Depends on | LIT-SAWA-001 (evidence IDs `L-xx`), ADR-SAWA-001 (ADR-001 … 008) |
| Numbering | Continues ADR-SAWA-001. ADR-001 … 008 live there. |

Each ADR states the decision, the evidence it rests on, what it costs, and how
we would know it was wrong. "Status: Proposed" means the reasoning is complete
and the owner has not yet accepted it — nothing here has been built yet unless
it says so.

---

## ADR-009 — Stop presenting photo-derived N, P, K as measurements

**Context.** SAWA v2 shows pH and N-P-K "predicted" from a photo; the home page
says *"SAWA reads its nutrients"* and lists *"4 signals predicted"*. The values
come from a darkness heuristic plus random noise (ADR-SAWA-001). LIT-SAWA-001
§2 establishes that even a properly trained model cannot recover available
N/P/K from an ordinary photo to an actionable standard (L-10 – L-12), while
organic carbon is genuinely predictable from calibrated colour (L-01 – L-09).

**Decision.** In v3, the camera path outputs only what colour can support:
calibrated colour and **Munsell notation**, **organic-carbon rating class**
(once validated), **visual moisture class**, and an image-quality verdict. N, P,
K and pH come only from a **measurement source** — a Soil Health Card entered
by the farmer, a lab, a reagent kit read by the phone, or a sensor — each
labelled with its source. The v2 heuristic remains reachable as a clearly
labelled "how the original prototype worked" demo, never as the main result.

**Cost.** The demo loses its most impressive-looking output. Home-page copy
must change (PUB-SAWA-001 §2).

**Would be wrong if.** A SAWA-run validation (VAL SV-003 design, extended to N/P/K)
on ≥ 150 local lab-paired samples showed photo-based class accuracy for a
nutrient at or above the reagent-kit visual baseline (L-31: 61/83/81 %). Then
that one nutrient could return, labelled as an estimate.

**Status.** Proposed.

---

## ADR-010 — Soil Health Card units and rating bands are canonical

**Context.** SAWA v2 reports N/P/K in "ppm" with thresholds (N 40/80, P 30/60,
K 40/70) taken from the original student code — not from any agronomic
standard. Farmers' cards report kg/ha with fixed bands (L-15) measured by fixed
methods (L-16), and P/K may be printed as oxides.

**Decision.**
1. Internal canonical units: available N, P, K in **kg/ha (elemental)**; OC in
   **%**; pH unitless; EC in **dS/m**; S and micronutrients in **mg/kg**.
2. A single conversion module handles P ↔ P₂O₅ (×2.29) and K ↔ K₂O (×1.2), and
   every stored value records the unit it arrived in.
3. Rating bands default to the SHC chart (N 280/560, P 10/25, K 108/280, OC
   0.5/0.75); the band table is data, not code, with a source per row, so the
   TNAU variant can be selected per state.
4. Every measurement carries `{source, method, unit_as_received}` (SYS-SAWA-001 §3).

**Cost.** Every v2 nutrient display and the 15-crop requirement table must be
rebuilt on the new bands.

**Would be wrong if.** A state SHC portal uses bands not representable as data
rows — then extend the table schema, don't hard-code.

**Status.** Proposed.

---

## ADR-011 — Fertiliser advice comes from ICAR STCR equations, verified against their own tables

**Context.** Turning soil numbers into "what to apply" is the step farmers
value most, and ICAR has already solved it per crop and soil with targeted-yield
equations (L-21). The compendium has no UP centre, but RAU Pusa covers adjacent
Bihar districts on the same alluvium (L-22). One equation set was
re-implemented this session and reproduced the official ready-reckoner (L-23).

**Decision.**
1. Encode equations as data: `{crop, centre, soil, valid_districts[], target_range, soil_test_ranges, method_units, coefficients, maintenance_min, quality_flag, source_page}`.
2. Only equations flagged good are usable (L-24).
3. Every encoded equation ships with a test reproducing its published
   reckoner table within ±1 kg/ha (VAL SV-004). An equation without a
   reproducible table is not shipped.
4. Selection order: exact district match → same soil order and agro-climatic
   zone → nearest validated centre with an explicit "nearest available
   equation" disclosure → fall back to the SHC's own general recommendation.
5. Soil test values outside an equation's calibration range are clamped
   **and** disclosed, never silently extrapolated.

**Cost.** Manual transcription of equations; mitigated by the reckoner tests.

**Would be wrong if.** Farmer-field outcomes (yield within ±10 % of target, L-25)
fail systematically in Gorakhpur — then pursue BHU Varanasi's UP equations or
an STCR collaboration.

**Status.** Proposed. Reference implementation verified for one equation set.

---

## ADR-012 — One codebase: Next.js PWA, offline-first, Hindi-first

**Context.** Single-codebase simplicity was the reason for v2 (RELEASES.md).
Users are on Android (L-38) in areas with patchy data. The developer uses an
iPhone.

**Decision.** Keep Next.js; make it an installable PWA with a service worker,
IndexedDB storage and a background sync queue. UI strings live in message
files from day one, with Hindi as the first non-English locale. A native
wrapper (Capacitor) is added only when a feature cannot work in the browser —
today that means BLE hardware on iOS (ADR-015).

**Cost.** Offline sync is real engineering (conflict rules in SYS-SAWA-001 §5).

**Would be wrong if.** Field testing (VAL SV-006) shows the target users cannot
install or retain a PWA — then wrap it earlier and ship through the Play Store.

**Status.** Proposed.

---

## ADR-013 — Retire MongoDB; use PostgreSQL + PostGIS

**Context.** The Atlas cluster in `.env.local`
(`cluster0.dgh17rz.mongodb.net`) returned NXDOMAIN from Google DNS on 11 Oct
2026 — deleted or renamed, not an allow-list issue. The owner has said MongoDB
is not considered important. v3's data is relational (farmer → field → sample
→ measurement → advice) and spatial (district lookup, field polygons, SHC
aggregation).

**Decision.** PostgreSQL with PostGIS (a managed free tier such as Neon or
Supabase for now), accessed through a typed query layer. Device-side storage
is IndexedDB. Persisting v2 analyses is not migrated — there is nothing in the
deleted cluster to migrate.

**Cost.** New dependency and schema work; the two v2 API routes change.

**Would be wrong if.** Hosting constraints force a document store — the schema
in SYS-SAWA-001 maps cleanly to documents too, so the cost of reversing is low.

**Status.** Proposed.

---

## ADR-014 — Train in Python, run models on the device via ONNX

**Context.** `src/lib/ml/train.ts` leaves the training stack open ("scikit-learn
via Python, or TensorFlow.js in Node"). Offline use and photo privacy both
favour on-device inference. SP-005 says start with tabular models.

**Decision.** Training lives in a separate `ml/` Python workspace
(scikit-learn / LightGBM first; PyTorch only when image models are justified).
Models export to ONNX and run in the browser with ONNX Runtime Web; the server
can run the same file as a fallback. Each model ships with a model card (data
hash, validation result, intended use, known failure modes).

**Cost.** Two languages. Accepted — the Python ecosystem is where the
soil-science and ML tooling is.

**Would be wrong if.** ONNX Runtime Web is too slow or heavy on target phones
(measure in VAL SV-006) — then infer on the server.

**Status.** Proposed.

---

## ADR-015 — Hardware: camera-first cradle before any electronics; never RS485 NPK probes for nutrients

**Context.** The owner wants a cheap phone-attached instrument "like a
glucometer". Evidence: phone-camera colorimetry ≤ 1 % bias (L-30); ICAR's own
colorimetric mini-lab ≥ 90 % lab agreement (L-32); visual reading is the main
error source in cheap kits (L-31); RS485 NPK probes are conductivity meters
(L-26); NIR is costly with non-transferable calibration (L-27 – L-29); USB from
a web app works on Android only (L-40).

**Decision.** Staged hardware (detail in HW-SAWA-001):
- **HW-0 "Lens cradle"** — no electronics: a light-tight clip-on box, diffuser,
  printed reference patches and a cuvette slot; reagent chemistry; the phone
  camera is the reader. Works on any phone, including iPhone.
- **HW-1 "Probe"** — USB-C dongle with a microcontroller (native USB + BLE),
  controlled LED illumination, a multi-channel spectral sensor reading the
  cuvette, and a high-impedance input for a pH (later K⁺) electrode. WebUSB on
  Android Chrome; BLE through the native wrapper on iOS.
- **Not pursued:** RS485 NPK probes for nutrient values (allowed only as EC or
  moisture trend sensors); AS7265x for soil NIR; MEMS FT-NIR until the business
  can carry its cost.

**Cost.** Reagents make every test a consumable — which is also the revenue
model (BIZ-SAWA-001 §4).

**Would be wrong if.** VAL SV-005 shows HW-0 category agreement with the lab no
better than the 61/83/81 % visual baseline — then the camera isn't adding value
and HW-1's photodiode reader becomes mandatory.

**Status.** Proposed.

---

## ADR-016 — Crop disease and deficiency are a later module, built on field data with abstention

**Context.** Owner wants crop disease and deficiency after the soil core.
Lab-image models collapse in the field (L-34); field data helps but doesn't
close the gap (L-35); a deployed app reached 65 % (L-36).

**Decision.** Not in the v3 core. When built: field images (PlantDoc, CC-BY-4.0,
plus SAWA's own with consent), crop-specific models, an explicit "not sure / not
in my list" output, and accuracy reported only on field photos.
PlantVillage-only training is prohibited.

**Status.** Proposed; deferred to Phase 6 (IMP-SAWA-001).

---

## ADR-017 — Third-party code and data intake policy

**Context.** The owner asked to merge similar open-source efforts into SAWA.
Several look-alike repos carry no licence, which legally means no reuse right
(LIT §8).

**Decision.**
1. No licence file → reference only; never copy code or data.
2. Permissive (MIT, Apache-2.0, BSD) → may vendor with attribution; prefer
   depending on the published package.
3. Weak copyleft (MPL-2.0) → use as an unmodified dependency.
4. Datasets: CC-BY → allowed with attribution recorded in DATA-SAWA-001.
5. Government documents (ICAR, SHC guidelines) → cite; transcribe facts,
   thresholds and equations (facts are not copyrightable), not prose.

Accepted under this policy now: `munsell` (npm, MPL-2.0). Queued:
PlantDoc (CC-BY-4.0) for Phase 6.

**Status.** Decided — needed immediately for the Munsell integration.

---

## ADR-018 — Where things live: public repo, private archive, laptop, personal server

**Context.** Four SAWA copies existed locally; two bug fixes lived only in an
untracked folder (ADR-SAWA-001 updates). The owner wants everything built so far
on GitHub, then local copies deleted, with only active work kept on the laptop.

**Decision.**
- `Enigmasatyabrat/SAWA` (**public**) — the product, its corpus, and technical
  history (`docs/archive/v1.0/`).
- `Enigmasatyabrat/soil-analysis-app` (**private**) — the v1 app, plus personal
  and academic material (conversation register, project memory register, report,
  presentation, screenshots).
- Laptop — active branches and work in progress only.
- Personal server — large binaries and anything not belonging to SAWA.

**Status.** Decided — executed in this session's PRs; cleanup list in REV-SAWA-001 §6.

---

## ADR-019 — Move the validation gate to the server as well

**Context.** RELEASES.md lists the known limitation: the image validation gate
runs client-side only and is bypassed by posting directly to the API.

**Decision.** `image-validation.ts` is DOM-free already; run it in the API
route too and reject or flag server-side. The client gate remains for instant
feedback and to avoid uploading unusable images.

**Status.** Proposed — small, independent, can ship early.

---

## ADR-020 — No claimed accuracy anywhere until its validation study passes

**Context.** SP-001/002 and the v1.0 CLAUDE.md non-negotiable #1, restated
because v3 introduces real models where the temptation to quote a number will
be real.

**Decision.** Every user-visible accuracy statement links to a passed study in
VAL-SAWA-001 (study ID, n, date, data hash). Literature numbers may be quoted
only as "published studies elsewhere report …", never as SAWA's performance.

**Status.** Decided.
