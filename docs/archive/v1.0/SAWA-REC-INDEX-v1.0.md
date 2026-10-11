# SAWA-REC — SAWA Research & Engineering Corpus
# MASTER INDEX v1.0.0

---

## What this is

The research and engineering documentation for **SAWA** — a computer-vision
soil and plant analysis platform, built by Satyabrat Mishra (B.Tech CSE,
AI/ML, ITM GIDA, Gorakhpur).

This is structured the same way as the `WG-REC` corpus you built for Water
Guardian (same document-ID scheme, same "one document per concern" idea),
**scaled to SAWA's actual size.** WG-REC is ~17,700 lines because it's a
multi-agency, multi-dataset research platform with a thesis and conference
paper attached. SAWA does not need that yet. Most rows below are marked
`PLANNED` — that's honest, not lazy. Write each one when you're actually
about to need it, not speculatively.

**Status:** v1.0.0 — foundation complete, consolidated repo.
**Started:** 15 August 2026. **Consolidated:** 17 August 2026.

---

## How to read this

If you are **starting implementation** → read `memory.md` first (project
state), then `ADR-SAWA-001` (decisions made so far), then
`SAWA-Roadmap.docx` (what to build, in order).

If you are **a future AI session** → read `memory.md`. It tells you what to
read next depending on what you're being asked to do.

If you are **Satyabrat on a Monday** → open `SAWA-Roadmap.docx`, find the
current phase, do the next unchecked item.

---

## Document registry

| ID | Title | Status | Purpose |
|---|---|---|---|
| **memory.md** | Cross-session state | **WRITTEN** | Continuity anchor — read first, always |
| **ADR-SAWA-001** | Architecture Decision Records, batch 1 | **WRITTEN** | Every real decision made so far, justified |
| **LEARNING-PATHWAY-PHASE2** | Learning pathway for Phase 2+ | **WRITTEN** | What to learn next (git, real ML, CV), assumes `LEARNING_GUIDE.md` already covers the current stack |
| **GIT-GUIDE** | Version control setup + workflow | **WRITTEN** | Practical, not theoretical — exact commands for this project |
| **CLAUDE.md** | AI session instructions (repo root) | **WRITTEN** | Ground truth + non-negotiables for any Claude Code / chat session on this repo |
| **PROMPTS** | Copy-paste prompts per phase | **WRITTEN** | Session opener, per-phase prompts, bug-fix and end-of-session prompts |
| **README.md** | Repo orientation (root) | **WRITTEN** | What SAWA does, honest limitations, layout, how to run |
| **SAWA-Roadmap.docx** | Phased roadmap, printable | **WRITTEN** | The actual plan, in order, with checkboxes |
| LIT-SAWA-001 | Literature: soil color science + plant phenotyping | PLANNED | Needed before Phase 2 (nutrient prediction) and Phase 4 (growth stage). Seed references already exist in the original report (Munsell Soil Color Chart 1905; Viscarra Rossel et al. 2006, R²=0.72 darkness↔organic-carbon) — expand from there, don't restart. |
| DATA-SAWA-001 | Dataset engineering: what to collect, how, from whom | PLANNED | This blocks everything in Phase 2. Write this before writing any training code. |
| SYS-SAWA-001 | System design v2 (DB schema, API spec for the real product) | PLANNED | Write once Phase 0 (repo consolidation) is done — no point designing v2 schema against a repo that still has the old confusion in it |
| AI-SAWA-001 | ML model design + training plan | PLANNED | Depends on DATA-SAWA-001 existing first |
| VAL-SAWA-001 | Validation framework (how do we know the model is actually more accurate than the heuristic?) | PLANNED | Write alongside AI-SAWA-001, not after |
| PUB-SAWA-001 | Publication / portfolio strategy | PLANNED | Low priority until Phase 2 produces something with real results to report |

---

## Architecture principles (borrowed and adapted from WG's AP-001–010)

| ID | Principle |
|---|---|
| SP-001 | A heuristic clearly labeled as a heuristic is honest engineering. An ML claim with no labeled data behind it is not. |
| SP-002 | Don't train on synthetic/simulated data and call it "real accuracy." (Applies directly to `sample_soil.jpg` — see `BUILD_LOG.md` — that image is a test fixture, never a training example.) |
| SP-003 | One canonical repo. The current three-way split (original app / Next.js showcase / this new corpus) gets consolidated in Phase 0, not carried forward indefinitely. |
| SP-004 | Every claim about plant biology or soil science gets a citation before it ships, the same evidence discipline as WG's LIT documents. |
| SP-005 | Simple solutions preferred unless a measured benefit justifies complexity — start Phase 2 with scikit-learn on tabular color features, not a CNN, unless/until the data volume and problem actually need it. |
| SP-006 | Every architecture decision gets written down in an ADR before code, the same discipline as WG. |
| SP-007 | Ship one working phase before starting the next. No Phase 3 work while Phase 1 (data collection) is still unstarted. |
| SP-008 | Test behaviour, not just types. A change can compile cleanly and still be wrong — ADR-002 and ADR-007 both did. Run it before calling it done. |
| SP-009 | When a fix surfaces a data gap, record it as a data task rather than tuning the logic to hide it again (see ADR-008). |

---

## Tech stack

| Layer | Current (Phase 0/1) | Phase 2+ candidate | Decided? |
|---|---|---|---|
| Backend | FastAPI + MongoDB (original app) | Same, unless DATA-SAWA-001 says otherwise | Yes, for now |
| Frontend/showcase | Next.js 16 static export | Stays as the marketing/demo layer | Yes |
| ML (tabular) | — | scikit-learn (RandomForest/GradientBoosting on color+texture features) | Proposed, see ADR-SAWA-002 |
| ML (image, later) | — | PyTorch, transfer learning from a pretrained CNN (ResNet/EfficientNet) once data volume justifies it | Proposed, not decided |
| Experiment tracking | — | Start as simple as a CSV/JSON log; only add MLflow/Weights&Biases if the CSV actually becomes painful | Proposed |
| Version control | Git, currently messy (.venv and node_modules were in the zip) | Same, cleaned up — see `GIT-GUIDE.md` | Yes |

---

## Naming candidates (not decided — Phase 6 task, doesn't block anything)

Quick brainstorm, not exhaustive. Do a proper trademark + domain check before
committing to any of these — that's a five-minute task, not a blocker, just
don't skip it:

- **SAWA** (keep it) — already has recognition value from the report/thesis; downside is it doesn't obviously read as "soil" or "agriculture" to a stranger.
- **Bhoomi** / **BhoomiAI** — "Bhoomi" = earth/land (Hindi/Sanskrit), immediately legible to the target market.
- **Mrida** — Sanskrit-adjacent for soil; distinctive, may need a tagline to explain itself.
- **Rootscope** — literal, in English, works for an international/portfolio audience.
- **Krishi[X]** — "Krishi" = agriculture; common prefix in Indian agtech naming, so it signals category fast but is less distinctive.

Company vs. side-project framing: you don't have to decide "company or
startup" now. A clean GitHub repo + a working demo + real validated results
*is* the decision-enabling artifact — that's what actually lets you (or a
co-founder, or an investor, or a grad-school committee) decide later. Don't
let the company-or-not question block Phase 0–2 work.

---

## Freemium notes (Phase 5, parking lot for now)

Rough shape worth having in the back of your mind while building Phase 1–2,
so you don't paint yourself into a corner:

- Free tier: soil analysis, limited analyses/month, no history.
- Paid tier: unlimited analyses, history/trends over time, growth-stage
  tracking per plant, export/reporting.
- The thing that actually justifies a paid tier is **accumulated value per
  user** (their own soil's history over seasons) — which means user
  accounts and persistence need to exist before freemium makes sense as a
  business model, not before it makes sense as a feature.

---

## Implementation entry point

**Read `memory.md` §5 ("Next action") — there is deliberately only one next
step listed, not a backlog.**
