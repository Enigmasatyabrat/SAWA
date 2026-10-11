# CLAUDE.md — working instructions for AI sessions on SAWA

You are working on **SAWA**, a computer-vision soil and plant analysis
project by Satyabrat Mishra (B.Tech CSE AI/ML, ITM GIDA Gorakhpur).

## Start here, every session

1. Read `memory.md` — current state, what's real vs. planned, the single
   next action. **Do this before touching anything.**
2. Read `docs/ADR-SAWA-001.md` if the task touches a decision already made.
3. Check `docs/SAWA-Roadmap.docx` (or `docs/ROADMAP.md`) for which phase
   the current work belongs to.

At the **end** of every session, update `memory.md`: what changed, what's
now true, what the next action is. A session that changes code but leaves
`memory.md` stale has failed at the thing `memory.md` exists for.

---

## Ground truth (do not re-derive, do not assume)

- The nutrient prediction (pH/N/P/K) is a **hand-tuned heuristic based on
  colour darkness**, not a trained model. It has never been validated
  against real lab results. Say so plainly in any user-facing copy,
  README, report, or commit message. Do not describe it as ML, AI
  prediction, or "trained" — it is none of those.
- The K-Means colour extraction **is** real unsupervised clustering. That
  part is legitimate and can be described as such.
- There is **no labelled dataset** (real soil photo ↔ real lab NPK result).
  Until one exists, no model trained in this repo can honestly claim
  improved accuracy. See "Non-negotiables" below.
- `sample_soil.jpg` is a **flat single-colour test fixture**, not a real
  soil photo. It is a valid unit-test input and an invalid training example.
- Three artifacts exist and are easy to confuse: the original full-stack
  app (`backend/` — real FastAPI/MongoDB, algorithm source of truth), the
  Next.js showcase site (`web/` — client-side port, marketing/demo), and
  the docs corpus (`docs/`). Know which one you're editing.

---

## Non-negotiables

These exist because breaking them produces work that looks finished and
isn't. Do not override them to satisfy a request for speed.

1. **Never fabricate accuracy numbers, metrics, or validation results.**
   If a number isn't from a run you actually executed, it doesn't go in
   code, docs, README, or a report. No placeholder metrics that "will be
   filled in later" — they never get filled in, they get quoted.
2. **Do not train a model before real labelled data exists.** A model
   fitted to heuristic outputs just relaunders the heuristic with a
   confidence score attached, which is strictly worse than the heuristic,
   because it hides the guess.
3. **Verify before claiming done.** "Done" means you ran it. For this repo:
   `npx tsc --noEmit`, `npx eslint`, and `npx next build` for `web/`;
   for `backend/`, at minimum import/syntax check plus exercising the
   changed function on real inputs. Report what you ran and what it said.
   Never write "should work" or "this fixes it" without execution.
4. **Test the behaviour, not just the types.** A change can compile
   cleanly and still be wrong. The ADR-002 crop-filter fix compiled fine
   and silently changed which crops appear; the ADR-007 canvas fix
   type-checked in a form that would never have updated on resize. Both
   were caught by reading and running, not by the compiler.
5. **Don't overstate novelty.** Plant phenotyping and growth-stage
   classification from images are established, published research areas.
   SAWA's real differentiation is a smartphone-only, no-lab-equipment,
   farmer-facing pipeline that combines soil and plant analysis — that's
   defensible. "Nobody has done this" is not, and will be checked.
6. **Cite before asserting agronomy or soil science.** Any claim about
   crop tolerances, nutrient ranges, or plant biology needs a real source
   before it ships (principle SP-004). Do not invent crop requirements.

---

## Working conventions

**Sequencing.** Phases run in order (see roadmap). Phase 2 (real ML) does
not start before Phase 1 (real data) produces samples. If asked to skip
ahead, say why that won't work rather than quietly building something
untrainable.

**Scope.** Prefer the smallest change that solves the actual problem.
If a task reveals a second problem, report it — don't silently expand the
diff to fix it too.

**Commits.** Conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`,
`refactor:`, `test:`. One logical change per commit. Commit at the end of
a session even if the work is incomplete — a commit is a checkpoint, not
a completion announcement.

**Never commit:** `.venv/`, `node_modules/`, `*.tsbuildinfo`, `.next/`,
`out/`, `.env`, datasets, or model weights. (`package-lock.json` **is**
committed.) The repo previously carried an 850MB virtual environment —
that's what the `.gitignore` is defending against.

**Decisions get written down.** Any non-obvious choice goes in
`docs/ADR-SAWA-001.md` as a new numbered ADR, with the reasoning and —
critically — what you verified. If you cross-reference an ADR from a code
comment, check the number is right; a wrong cross-reference is worse than
none.

---

## Tone for user-facing text

Plain and accurate. This project's credibility rests on being honest about
what it does and doesn't do — an examiner, a recruiter, or a farmer all
lose trust the same way when a demo overclaims. "Estimated from colour
analysis, not a lab test" is a better line than "AI-powered soil
intelligence."

---

## If you're unsure

Ask, or state the uncertainty in your output. Do not resolve ambiguity by
picking the version that produces a more impressive-sounding result. The
whole reason this file exists is that the previous version of this project
drifted toward looking finished rather than being finished.
