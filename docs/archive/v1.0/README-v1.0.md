# SAWA

Computer-vision soil analysis: photograph a patch of soil, get an estimated
soil type, a pH / N-P-K profile, and a shortlist of crops suited to it.

Built by **Satyabrat Mishra** — B.Tech CSE (AI & ML), ITM GIDA, Gorakhpur.

---

## What this actually does today — read this first

SAWA extracts the five dominant colours from a soil photo using **K-Means
clustering** (real unsupervised learning), classifies soil type from colour
thresholds, and then estimates pH/N/P/K using a **hand-tuned heuristic based
on colour darkness**.

That last part is **not a trained model** and has **not been validated
against laboratory soil tests**. It is a reasonable-looking formula, not a
measurement. Treating its output as a substitute for a real soil test would
be a mistake.

Turning that heuristic into a genuine, validated model is the point of the
roadmap below — and the honest bottleneck is data, not modelling.

---

## Repository layout

```
SAWA/
├── CLAUDE.md      # Working instructions for AI coding sessions — read first
├── memory.md      # Current project state, decisions, single next action
├── backend/       # FastAPI + MongoDB — the algorithm source of truth
├── web/           # Next.js showcase site (client-side port of the pipeline)
└── docs/          # Corpus: decisions, roadmap, learning path, history
```

**`backend/`** is the original full-stack app's API. It holds the canonical
implementation of the analysis pipeline.

**`web/`** is a portfolio/marketing site with a TypeScript port of the same
pipeline that runs entirely in the browser, so the demo works without a
server. It's a showcase, not the product. (It carries its own `AGENTS.md`
with Next.js version-specific notes — heed those when editing it.)

---

## Documentation

| File | What it's for |
|---|---|
| `memory.md` | **Start here.** Current state, what's real vs. planned, next action. |
| `CLAUDE.md` | Instructions and non-negotiables for AI sessions on this repo. |
| `docs/SAWA-Roadmap.docx` | The phased plan, printable, with checkboxes. |
| `docs/SAWA-REC-INDEX.md` | Corpus index and architecture principles. |
| `docs/ADR-SAWA-001.md` | Every architectural decision, with reasoning and verification. |
| `docs/PROMPTS.md` | Copy-paste prompts for each phase of work. |
| `docs/GIT-GUIDE.md` | Version control setup and workflow. |
| `docs/LEARNING-PATHWAY-PHASE2.md` | What to learn next (git → scikit-learn → CV). |
| `docs/LEARNING_GUIDE.md` | Deep guide to the *current* stack (React/FastAPI/K-Means/MongoDB). |
| `docs/CONVERSATION_INTELLIGENCE_REGISTER.md` | Narrative project history. |
| `docs/BUILD_LOG-nextjs.md`, `docs/test_result.md` | Build and test records. |

---

## Roadmap at a glance

| Phase | Goal | Status |
|---|---|---|
| 0 | Consolidate into one clean repo, fix version control | In progress |
| 1 | Design and run real data collection (photo ↔ lab NPK) | Not started |
| 2 | First genuinely trained model, validated against the heuristic | Blocked on Phase 1 |
| 3 | Plant growth and health analysis | Not started |
| 4 | Growth-stage classification from multi-angle images | Not started |
| 5 | Platform: accounts, history, freemium tiers | Not started |
| 6 | Naming, company decision, publication | Not started |

**Phase 2 does not begin before Phase 1 produces real samples.** A model
fitted to heuristic outputs would only relaunder the guess with a
confidence score attached. Full reasoning in `docs/ADR-SAWA-001.md`.

---

## Running it

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your MongoDB connection string
uvicorn server:app --reload
```

**Web**
```bash
cd web
npm install
npm run dev                   # http://localhost:3000
npm run build                 # static export to web/out/
```

---

## Known issues and recent fixes

Two real bugs were found and fixed (see `docs/ADR-SAWA-001.md` for the full
record, including what was verified):

- **ADR-002** — the crop-matching filter only ever tested `"high"` nutrient
  requirements; `"medium"` and `"low"` requirements passed unconditionally,
  so recommendations were driven almost entirely by pH. Fixed in both
  `backend/server.py` and `web/src/lib/soil-engine.ts`, verified to produce
  identical results in both implementations.
- **ADR-007** — the homepage animation forced a layout reflow on every
  frame. Canvas dimensions are now cached and refreshed only on resize.

Open, and worth knowing about:

- **ADR-008** — no crop in the 15-crop database tolerates low phosphorus or
  low potassium, so sandy/low-fertility soils return no recommendations.
  This is a **data gap**, not a logic bug — the old broken filter was
  hiding it. Assigned to Phase 1.

---

## Honest limitations

- Nutrient values are estimates from colour, not measurements. Not a
  replacement for a soil test.
- The crop database holds 15 crops with a known gap in low-P/low-K coverage.
- Soil type classification uses fixed RGB thresholds, so lighting and
  camera differences affect results.
- No model has been trained or validated yet.

These are listed because a tool that overstates what it knows is worse than
one that says plainly where it stops.
