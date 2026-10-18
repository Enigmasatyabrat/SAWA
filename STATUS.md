# SAWA status (18 October 2026)

A snapshot of where the project stands, written so that the next session, human
or AI, does not have to reconstruct it from commits and scattered notes. It
describes `main` at `cc65945` (merge of PR #19).

## What is built

| Area | State | Where |
|---|---|---|
| Next.js full-stack app (v2.0.0, "Plan B") | Working. Home, analyzer, about, technology, roadmap and contact pages | `src/app/` |
| Soil analysis API | `POST /api/analyze-soil`, results saved to MongoDB (`sawa_db.analyses`) | `src/app/api/analyze-soil/` |
| Analysis engine | K-Means colour extraction (real clustering), soil classification, nutrient and crop logic ported from Plan A. **Nutrient values are a hand-tuned colour-darkness heuristic, not a trained model** | `src/lib/soil-engine.ts` |
| Validation gate | Client-side check that decides whether an image is sent to the API at all | `src/lib/image-validation.ts` |
| Evidence layer | Explains why a soil was classified the way it was | `src/lib/evidence.ts` |
| CI | Lint, typecheck and build on every push and PR. The build runs without the database secret | `.github/workflows/` |
| Phase 1A tooling | Capture protocol, printable 20-sample checklist, metadata and manifest scripts | `data/phase-1a/`, `docs/PHASE-1A-CAPTURE-PROTOCOL.md`, `scripts/` |
| ML feasibility studies | Four studies on public lab-labelled data. **Not wired into the app** | `ml/` (see `ml/reports/FINDINGS.md`) |

`src/lib/soil-engine.ts` is the single source of truth for the analysis
algorithms, shared by the API and the UI. Its algorithms must not be rewritten
or stubbed; change them only deliberately, with evidence.

## What changed since Phase 0 (`4c0dc8b`, 19 Aug 2026)

`4c0dc8b` removed an empty `CLAUDE.md` and is the last commit of the Phase 0
consolidation. Since then, on `main`:

1. `c1bc663` (21 Aug): **Phase 1A** photo collection pipeline (toolkit and scripts).
2. `65ccf75` (10 Sep): Atlas connectivity troubleshooting docs; releases point at Phase 1A.
3. `45c0e24` (26 Sep): `MONGODB_URI` is read when connecting, not at import time, so the app builds without the secret.
4. `719d73d` (26 Sep): CI on every push and pull request (PR #1).
5. `d413840` (14 Oct): **ML feasibility studies** (PR #16), 31 files, about 3,900 lines under `ml/`.
6. `65c3630` (18 Oct): ship sharp's Linux binaries with the analyze-soil function, fixing the Vercel deployment (PR #19).

## What changed since Phase 1A (`c1bc663`)

Items 2 to 6 above: 40 files changed, about 4,000 lines added, almost all in
`ml/` plus the CI workflow. The app code changed in only two places: the lazy
database connection in `src/lib/mongodb.ts` and the sharp tracing setting in
`next.config.ts`. `src/lib/soil-engine.ts` is unchanged since 18 Aug.

### What the ML studies found (14 Oct, `ml/reports/FINDINGS.md`)

- The shipped pH, P, K and soil-type outputs have no useful agreement with lab values, even with perfectly calibrated colour.
- Colour carries a real but modest signal for organic carbon and total N, and almost none for pH, P, K or clay.
- On real phone photos, colour predicts organic carbon with median R² about 0.47 to 0.53 on the same phone, but a model does not transfer between phones.
- The shipped validation gate accepts 78 % of ordinary non-soil photos.
- Conclusion recorded there: ADR-009 (stop showing photo N/P/K) is strongly supported. Organic carbon is the one property worth pursuing, with a grey card in frame and set-valued answers. The gate fix needs SAWA's own diverse soil photos (Phase 1A), not a model trained on borrowed sources.

## Current phase

**Phase 1A: tooling complete, collection not started.** `data/phase-1a/manifest.csv`
contains 0 samples. The next real step is capturing the 20-sample pilot with
the protocol in `docs/PHASE-1A-CAPTURE-PROTOCOL.md`, then Phase 1B (lab results
into the `*_later` columns).

Ground rule from the project notes: do not start Phase 2 (training models for
the app) before Phase 1 has real data.

## Open tasks

Open pull requests (18 Oct):

| PR | Branch | What |
|---|---|---|
| #12 | `fix/port-v1-fixes` | Port the v1.0 crop-filter and canvas fixes; harden manifest CSV parsing |
| #13 | `feat/munsell-notation` | Report soil colour in Munsell notation (munsell.js) |
| #14 | `docs/sawa-rec-v2` | SAWA-REC v2: research corpus, v3 architecture, hardware and business plan |
| #2 to #10, #15, #17, #18 | `dependabot/*` | Dependency updates |

Known limitations still open (from `RELEASES.md` and the studies):

- Nutrient output is a heuristic and should not be presented as a prediction (ADR-009 pending).
- The validation gate is client-side only and can be bypassed by posting to the API directly; it also accepts most non-soil photos.
- No history endpoint: analyses are stored but cannot be queried.
- K-Means seeding uses `Math.random()`, so dominant colours can shift slightly between runs.
- Two high-severity transitive npm audit advisories (the Dependabot PRs may cover them).
- Phase 1A pilot capture (20 samples) has not been done.

## Map of the local folders (`D:\New folder (2)\SAWA-------ALL\`)

| Folder | What it is | State |
|---|---|---|
| `SAWA-validation-gate-update\SAWA-nextjs-source` | **This repo** (`Enigmasatyabrat/SAWA`, public) | The real, current Next.js app. All branches pushed except two local `backup-before-*` branches from August |
| `SAWA-validation-gate-update\SAWA-nextjs-source\ml\data`, `ml\.venv` | Downloaded public datasets (about 22 GB) and the Python environment (about 5 GB) | Not committed by design; re-creatable with `ml/README.md` |
| `SAWA-validation-gate-update\SAWA-static-build` | A static export of the site | Build output |
| `SAWA-validation-gate-update\screenshots` | App screenshots | Local only |
| `SAWA (soil-analysis-app)` | `Enigmasatyabrat/soil-analysis-app` (private): the old **Plan A**, React frontend plus FastAPI backend | Archived reference, fully pushed (`archive/v1-consolidation`). Its backend has a committed virtualenv (F-16) |
| `files (4)` | Notes (`CLAUDE.md`, `memory.md`, `PROMPTS.md`, `ADR-SAWA-001.md`, `SAWA-REC-INDEX.md`) and a `SAWA-v1.0` snapshot | About 12 files here are in no repo (for example `ADR-SAWA-001.md`, `BUILD_LOG.md`, `AnalyzerClient.tsx`, the roadmap and technology pages). Review before deleting |
| `.claude` | Local Claude settings | Local only |

Other copies elsewhere on the laptop: `D:\SAWA-gh` is an older clone of this
repo with nothing unpushed. `C:\Users\SATYABRAT MISHRA\soil-analysis-app` is an
old copy of the Plan A repo whose 2.8 GB is untracked GoPro clips.

## Working rules carried over from the project notes

From `files (4)/CLAUDE.md` and `memory.md` (last updated 17 Aug, so older than this file):

- Describe the nutrient numbers honestly: a hand-tuned heuristic, never "ML", "AI prediction" or "trained".
- The K-Means colour extraction is real unsupervised clustering and can be described as such.
- There is no labelled dataset (real soil photo with real lab NPK) yet, so no model can honestly claim better accuracy.
- `sample_soil.jpg` is a flat single-colour test fixture, not a real soil photo.
- Keep `memory.md` and this file current at the end of a working session.
- Commits use `191788479+Enigmasatyabrat@users.noreply.github.com` and carry no AI co-author lines.
