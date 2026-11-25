# IMP-SAWA-001
# Implementation Roadmap — prototype to product, in order

---

## Document Control

| Field | Value |
|---|---|
| Document ID | IMP-SAWA-001 |
| Version | 1.0.0 |
| Status | Plan. Supersedes the v1.0 phase table (archived `docs/archive/v1.0/SAWA-Roadmap.docx`) where they differ. |
| Created | 11 October 2026 |
| Effort assumption | One developer, a B.Tech student, ~10–15 focused hours/week. Durations are **D**-confidence estimates. |

---

## 0. How v1.0's phases map to v3

| v1.0 phase | v3 phase | What changed |
|---|---|---|
| 0 Consolidate | **P0** (finishing now) | Same goal; executed via PR #12 + this corpus PR |
| 1 Data collection | **P1** | Same, plus grey card and SHC-method lab columns (DATA §2) |
| 2 Real ML v1 | **P3** | Retargeted from N/P/K to OC class (ADR-009) |
| — | **P2 Card-to-plan** (new) | Delivers real value **without ML** — inserted ahead of ML |
| 3–4 Plant growth / stage | **P6** crop health | Deferred behind the soil core |
| — | **P4–P5 hardware** (new) | The owner's phone-attached instrument |
| 5 Platform / freemium | **P2 + P7** | Accounts arrive with P2; business pilot in P7 |
| 6 Naming / company | **P7** | After pilot evidence |

**Sequencing rule (SP-007, kept):** one phase is "done" when its exit
criteria pass, not when its code compiles. P1 and P2 can run in parallel
because P2 does not depend on collected data.

---

## P0 — Consolidation and hygiene · ~2 weeks

| # | Task | Exit check |
|---|---|---|
| 0.1 | Merge PR #12 (crop filter, canvas, CSV) | CI green on `main` |
| 0.2 | Merge this corpus PR | Corpus on `main` |
| 0.3 | Merge the Munsell PR (first external-code intake under ADR-017) | Munsell shown, labelled uncalibrated |
| 0.4 | Push v1-era archive + personal registers to the **private** `soil-analysis-app` | Local-only files all on GitHub (REV §6) |
| 0.5 | **Fix the Vercel project** (check output setting / env vars in the dashboard) | Vercel check green on `main` |
| 0.6 | Triage 10 Dependabot PRs (Actions bumps first; Next.js bump only after reading `node_modules/next/dist/docs/`) | No stale bot PRs |
| 0.7 | Remove the dead MongoDB dependency path or point it at Postgres (ADR-013) | `/api/test-db` replaced by `/api/v3/health` |
| 0.8 | Run the image gate server-side (ADR-019) | Direct POST of a non-soil image is rejected |

## P1 — Data pilot (Phase 1A → 1B) · ~6 weeks, parallel with P2

| # | Task | Exit check |
|---|---|---|
| 1.1 | Buy grey card; run Phase 1A on 20 samples | SV-001 met |
| 1.2 | Phase 1B schema change (unit-neutral lab columns + method + unit + card flag — DATA §2.1) with scripts updated | Scripts tested on fixtures |
| 1.3 | Send samples to a lab using SHC methods; record lab IDs | Lab columns filled |
| 1.4 | SV-002 colour repeatability (3 shots × 2 phones on 10 soils) | Report committed |
| 1.5 | Approach 1–2 labs (VLSTL / KVK) as data partners (DATA §3.1) | Written agreement or clear no |

## P2 — Card-to-plan: the first real product, no ML · ~8 weeks

| # | Task | Exit check |
|---|---|---|
| 2.1 | Canonical units + SHC bands as data (C-1, ADR-010) | Unit tests incl. P₂O₅/K₂O conversions |
| 2.2 | STCR advisor (C-2): encode Pusa + Pantnagar wheat/rice/maize/mustard equations flagged "Good"; add BHU-Varanasi UP equations from their papers | **SV-004**: every encoded reckoner reproduced ±1 kg/ha |
| 2.3 | Rebuild crop table with one citation per row, incl. low-P/low-K-tolerant crops (millets, pulses) | ADR-008 closed: Sandy soils get recommendations |
| 2.4 | `/plan` flow: SHC entry → ratings → crop + target → doses → products, with disclosures | End-to-end test |
| 2.5 | Hindi message catalogue; PWA install + offline (service worker, IndexedDB) | Works in airplane mode |
| 2.6 | Postgres + phone-OTP accounts + field history | Data survives reinstall |
| 2.7 | SV-006 with ≥ 10 farmers and ≥ 3 lab operators | Acceptance met or redesign |

**Release R1 = P2.** First version a farmer can use for a real decision.

## P3 — Camera v2: calibrated colour · ~8–12 weeks (data-gated)

| # | Task | Exit check |
|---|---|---|
| 3.1 | Grey-card detection + colour correction (C-3) | SV-002 targets met |
| 3.2 | Munsell from corrected colour (C-4 upgrade) | Marked "calibrated" only when the card is detected |
| 3.3 | Moisture class (M-3) | Beats majority baseline |
| 3.4 | Collect D-03 to ≥ 150 lab-paired samples via partners | Dataset release hashed |
| 3.5 | OC class model (M-2), ONNX on device | **SV-003** passes, or the feature is dropped (AI §7) |
| 3.6 | Site copy pivot (ADR-009, PUB §2) | No photo-derived N/P/K presented as measurement |

## P4 — HW-0 "Lens" cradle · ~6–8 weeks

| # | Task | Exit check |
|---|---|---|
| 4.1 | Print cradle; linearity test with a coloured dilution series on 2 phones (HW H0.1) | R² ≥ 0.99 same-frame ratio |
| 4.2 | Griess-Zn nitrate + molybdenum-blue P on 10 lab-tested soils (H0.2) | Beats visual baseline |
| 4.3 | Full panel incl. K turbidity + pH on 30–50 soils (H0.3) | **SV-005** |
| 4.4 | Reagent sourcing quotes, MSDS, Hindi safety sheet | Cost per test known (BIZ §4) |
| 4.5 | NIDHI-PRAYAS / RKVY-RAFTAAR application with SV-005 data | Submitted |

## P5 — HW-1 "Probe" dongle · ~3–4 months

Breadboard → PCB → WebUSB on Android → BLE on iOS (HW §9 H1.1–H1.3).
Exit: readings match HW-0 / lab within SV-005 tolerances; provenance stored.

## P6 — Crop health module · later

PlantDoc + consented field images; per-crop models with abstention (ADR-016);
SV-008.

## P7 — Business pilot · overlaps P4–P5

3 VLSTL / FPO labs using SAWA Lab + Lens on real samples; ≥ 300 tests; repeat
refill orders; then the company / naming decision (BIZ §6, §9).

---

## Next 10 working sessions (concrete)

1. Merge PR #12 after reading its behaviour-change table.
2. Review and merge the corpus PR; sign off or amend ADR-009 … 020 (REV §5).
3. Review the Munsell PR in the browser.
4. Vercel dashboard: inspect the failing deployment log; fix the project settings.
5. Merge the GitHub Actions Dependabot PRs (#2, #3); read the Next.js docs before #11.
6. Buy the grey card; start Phase 1A collection (SV-001).
7. Write `src/lib/advisor/units.ts` + tests (2.1).
8. Encode the verified Pusa wheat equation + its reckoner test (2.2 / SV-004).
9. Find and read the BHU Varanasi STCR papers for eastern UP; transcribe only equations with printed reckoners or validation tables.
10. Draft the `/plan` page in Hindi and English (2.4, 2.5).
