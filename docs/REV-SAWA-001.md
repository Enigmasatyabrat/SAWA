# REV-SAWA-001
# Review — blueprint audit, findings, confidence register, open decisions, cleanup manifest

---

## Document Control

| Field | Value |
|---|---|
| Document ID | REV-SAWA-001 |
| Version | 1.0.0 |
| Status | Written 11 October 2026 — read this first in any new session |
| Method | Every "verified" item below was executed or read from source in the session that wrote this corpus; nothing is carried over unchecked from earlier documents |
| PRs from that session | [SAWA#12](https://github.com/Enigmasatyabrat/SAWA/pull/12) fixes · [SAWA#13](https://github.com/Enigmasatyabrat/SAWA/pull/13) Munsell · this corpus PR · [soil-analysis-app#1](https://github.com/Enigmasatyabrat/soil-analysis-app/pull/1) private archive |

---

## 1. What exists (the blueprint)

Four SAWA copies existed on the laptop. Compared file by file:

| Copy | What it was | Verdict |
|---|---|---|
| `SAWA-validation-gate-update/SAWA-nextjs-source` | Git clone of public `Enigmasatyabrat/SAWA` — Next.js v2, API routes, validation gate, Phase 1A toolkit, CI | **The best one** — canonical |
| `files (4)/SAWA-v1.0/SAWA` | August consolidation tree (not a git repo): v1.0 corpus + two bug fixes **that existed nowhere else** | Merged into the canonical repo and the private archive |
| `SAWA (soil-analysis-app)` | Git clone of private `soil-analysis-app` — v1 React + FastAPI | Archive; received the backend fix |
| `SAWA_files_v 0.1` | Academic report, presentation, screenshots | Private archive |

---

## 2. Verified state of the app

| Check | Result |
|---|---|
| Typecheck / lint / production build | Clean / 0 errors (1 old font warning) / green |
| GitHub Actions CI | Passing on `main` and on #12 |
| Analyzer end to end in a browser | `POST /api/analyze-soil` → 200; results render |
| Crop filter (ADR-002) | Fixed in #12 — 0 rule violations over 6,696 inputs; Python backend identical on all 6,696 |
| Hero canvas (ADR-007) | Fixed in #12 — 0 forced reflows per second |
| Munsell notation | Added in #13 — 305/307 in-gamut soil-chart chips round-trip exactly; kept out of the client bundle |

---

## 3. Findings register

| # | Finding | Severity | Status / owner action |
|---|---|---|---|
| F-01 | Two bug fixes (crop filter, canvas) lived only in an untracked local folder | High | **Fixed** — #12 and soil-analysis-app#1 |
| F-02 | **Vercel deployments fail on every commit** since the project was connected (`main` HEAD included); GitHub Actions builds pass. Logs not readable here — the Vercel connector lacks access to the `enigmasatyabrats-projects` scope | High | **Owner:** open the failing deployment's log in the Vercel dashboard. *Hypothesis (unverified):* the project was created ~15 Aug 2026 while the app was a static export and still expects an `out/` output directory |
| F-03 | **MongoDB Atlas cluster `cluster0.dgh17rz` returns NXDOMAIN** from Google DNS — deleted or renamed, not an allow-list issue. App degrades gracefully | Medium | Retire MongoDB (ADR-013) — owner said it is not important |
| F-04 | Home page and meta description claim *"SAWA reads its nutrients"* and *"4 signals predicted"* | High (credibility) | Proposed copy in PUB-SAWA-001 §2 — **needs sign-off of ADR-009** |
| F-05 | Nutrient units are "ppm" with non-standard thresholds; farmers' cards use kg/ha bands | High | ADR-010; IMP P2.1 |
| F-06 | Crop database tolerates no low-P or low-K soils → Sandy soil returns no crops 54 % of the time now the filter works | Medium | ADR-008; rebuild table with citations (IMP P2.3) |
| F-07 | Image validation gate is client-side only (bypassable) | Medium | ADR-019; IMP P0.8 |
| F-08 | Phase 1A lab columns are named `*_ppm_later` | Medium | DATA §2.1 — change in Phase 1B **before** any lab data exists |
| F-09 | Phase 1A protocol forbade a colour card, which would have made the 20 photos uncorrectable | Medium | **Fixed** in this PR (grey card) |
| F-10 | 10 Dependabot PRs open (#2–#11); all Vercel checks red for the reason in F-02 | Low | Merge Actions bumps first; read Next.js docs before #11 (AGENTS.md) |
| F-11 | `soil-analysis-app` clone committed with the private Gmail address (blocked by GitHub email privacy) | Low | **Fixed** — repo-local no-reply email, matching the SAWA clone |
| F-12 | K-Means seeded with `Math.random()` and nutrients add gaussian noise → the same photo gives different numbers | Low (demo) | Becomes moot with ADR-009; until then documented in RELEASES |
| F-13 | Empty-state copy claimed "the model keeps improving" | Low | **Fixed** in #12 |
| F-14 | FAQ says the heuristic is "built on colour-to-property correlations from soil science literature" — true only for darkness → organic carbon | Low | PUB-SAWA-001 P-5 |
| F-15 | The June 2026 research backbone's citations are chat-tool markers with no resolvable sources | Info | Archived as-is; do not cite it — cite LIT-SAWA-001 |
| F-16 | `soil-analysis-app` has a **Python virtual environment committed** (`backend/venv/…`); its "Python package" workflow lints numpy/joblib inside it and has failed since it was added on 9 Sep 2026 (on `main` too, not only on #1). One real hit in project code: `backend/server.py` unused `global client` (F824) | Low (archived repo) | Untrack `backend/venv/` and add it to `.gitignore`, or delete the template workflow — owner's call since the repo is archived |

---

## 4. Confidence register — "is the confidence high enough?"

Desk research can raise confidence in **direction**; only experiments and quotes
can raise confidence in **numbers**. Where each part stands:

| Area | Grade | Why | What would raise it |
|---|---|---|---|
| Pivot: photos can't give N/P/K; OC is feasible (ADR-009) | **B → A-** | Consistent across many independent studies (LIT §1–2) | SV-003 on local soils |
| SHC units, bands, methods (ADR-010) | **B** | 4 independent sources agree; second chart (TNAU) documented | Official ICAR-IISS manual copy |
| STCR advisor (ADR-011) | **A** | Equations read from ICAR's compendium; re-implementation reproduces ICAR's own table | SV-004 for every equation encoded |
| Chemistry + phone as instrument (ADR-015) | **B** (principle) / **D** (our build) | ICAR mini-lab ≥ 90 %, phone readers ≤ 1 % bias elsewhere | SV-005 |
| RS485 NPK probes rejected | **B** | Mechanism + independent comparison | — |
| Platform facts (Android share, WebUSB/iOS) | **B** | Multiple sources incl. Apple DTS | — |
| Market facts (SHC scale, labs, VLSTL grant) | **B** | Government factsheets + secondary | — |
| Competitor facts | **C** | Some figures from older profiles | Direct quotes |
| Hardware BOM and reagent cost | **D** | Estimates | Supplier quotes (IMP P4.4) |
| Business volumes and prices | **D** | Hypotheses | VLSTL interviews (BIZ §6) |
| Regulation of reagent kits | **D** | Not researched in depth | Professional advice before selling |
| Effort estimates | **D** | One-developer assumption | Track actuals |

**Verdict.** Confidence is **high (A/B) on what to build, in what order, and
why** — the decisions that would be expensive to get wrong. It is **low (D) on
costs, volumes and SAWA's own accuracy**, by design: those are now framed as
pre-registered experiments (VAL) and quotes (IMP P4.4), which is the only way
they can become high. More desk research would not move them.

---

## 5. Decisions only the owner can make

1. **Accept or amend ADR-009** (stop presenting photo N/P/K) — and with it the
   home-page copy in PUB-SAWA-001 §2. Everything in P3 depends on this.
2. **Accept ADR-010 … 021** as a batch, or mark the ones to revisit.
3. **Vercel:** read the failing deployment log (F-02), or authorise the Vercel
   connector for the `enigmasatyabrats-projects` scope so it can be diagnosed
   from a session.
4. **Merge order:** #12 → (#13, this PR) → soil-analysis-app#1. #13 and this
   PR are stacked on #12 and will retarget to `main` automatically.

---

## 6. Local cleanup manifest

Do **not** delete anything until the PRs listed for it are merged. Paths are
under `D:\New folder (2)\`.

| Local path | Now on GitHub at | Action |
|---|---|---|
| `SAWA-------ALL\SAWA-validation-gate-update\SAWA-nextjs-source` | `Enigmasatyabrat/SAWA` | **Keep** — the active working clone |
| ↳ `h origin maingit rm CLAUDE.md` (empty file from a mistyped command) | — | Delete |
| `SAWA-------ALL\SAWA-validation-gate-update\SAWA-static-build` | regenerable build output | Delete |
| `SAWA-------ALL\SAWA-validation-gate-update\IMPROVEMENTS.md`, `VALIDATION_SYSTEM_PROMPT.md` | identical copies already in SAWA root | Delete |
| `SAWA-------ALL\SAWA-validation-gate-update\screenshots` | soil-analysis-app#1 `archive/screenshots/validation-gate/` | Delete after #1 merges |
| `SAWA-------ALL\files (4)\SAWA-v1.0` | fixes → #12 and #1; docs → this PR `docs/archive/v1.0/` + `ADR-SAWA-001`; memory → #1; `web/` superseded by SAWA | Delete after #12, this PR and #1 merge |
| `SAWA-------ALL\SAWA (soil-analysis-app)` (incl. `.venv`, `venv`) | `Enigmasatyabrat/soil-analysis-app` | Delete the clone after #1 merges (re-clone if needed) |
| `SAWA-------ALL\.claude\settings.local.json` | — (local tool permissions, not project data) | Your call; harmless to delete |
| `SAWA_files_v 0.1` — report, presentation, screenshots, register | soil-analysis-app#1 `archive/` | Delete after #1 merges … |
| ↳ `ss's\2025 DSTL notes Unit 2.pdf`, `ss's\loops.py`, `ss's\export default function BackstageReality.html`, `ss's\2026-04-03.md` (empty) | **not on GitHub — not SAWA** | **Move to personal server first** |
| `ZIPS and rest\SAWA_Research_Backbone_and_Master_Prompt.md` | this PR `docs/archive/SAWA-Research-Backbone-2026-06.md` | Delete after merge |
| `ZIPS and rest\PROJECT_MEMORY_REGISTER_FULL.md` | identical to the copy in #1 | Delete after #1 merges |
| `ZIPS and rest\SAWA (soil-analysis-app).zip`, `… (2).zip` (357 MB each; **contents differ**), `SAWA-validation-gate-update*.zip` | snapshots — contents **not** verified file-by-file against GitHub | **Move to personal server**, don't delete |
| `ZIPS and rest\Untitled-1.html` | differs from the archived `Untitled-1.html`; content not identified | Move to personal server |
| `WG-corpus`, `STEPSTAKE`, `files`, `files here`, `fl p`, `notes`, other `ZIPS and rest` items | not SAWA | Out of scope — untouched |

---

## 7. The June 2026 research backbone, reconciled

`docs/archive/SAWA-Research-Backbone-2026-06.md` proposed features and an
architecture before this corpus existed. Where each item landed:

| Backbone item | Where it lives now |
|---|---|
| Gemini as vision-and-language brain | **ADR-021** — observe, triage, phrase; never measure |
| AI not alone for chemistry / prescriptions | Agrees — ADR-009, ADR-011, ADR-020 |
| Confidence-aware analysis | AI §3 (conformal sets, abstention) |
| History tracking, soil context inputs | SYS §3 data model; IMP P2.6 |
| Recommendation explainability | ADR-011 disclosures; API advice `equation` + `disclosures` |
| Dataset-building mode | DATA §3.1 lab partners; SYS F-4 |
| Hybrid field report export | BIZ §4 "SAWA Lab" SHC-format reports |
| Sensor integration | HW-SAWA-001 |
| Upload comparison, batch analysis, similarity/cluster view, research mode, expert-review loop | **Not yet scheduled** — backlog after P3 (they need D-03 data to be meaningful) |
| FastAPI backend | Superseded by the single Next.js codebase (v2.0.0 decision, ADR-012) |
