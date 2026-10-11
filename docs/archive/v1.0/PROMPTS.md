# PROMPTS.md — ready-to-paste prompts for Claude Code

Copy these verbatim when you start each piece of work. They're written to
front-load context so you don't spend the first ten messages re-explaining
the project.

Every prompt assumes `CLAUDE.md` and `memory.md` are in the repo root, so
Claude Code picks them up automatically. If you're in a plain chat instead,
paste `memory.md` first.

---

## 0. Session opener (use this every time)

```
Read CLAUDE.md and memory.md first, then tell me:
1. What you understand the current state of the project to be
2. What memory.md says the next action is
3. Anything in those files that looks stale or contradictory

Don't start work until I confirm.
```

Why this shape: it forces a state check and catches doc drift before it
compounds. The third question matters — the docs are only useful if
they're corrected when they go wrong.

---

## 1. Phase 0 — repo consolidation

```
Phase 0 from docs/ROADMAP.md. Goal: one clean canonical repo.

1. Verify .gitignore covers .venv/, node_modules/, *.tsbuildinfo, .next/,
   out/, .env, and dataset/model files. Fix if not.
2. Check `git status` and `git ls-files` for anything currently tracked
   that shouldn't be (build artifacts, virtualenvs, secrets). Report before
   removing anything.
3. Confirm backend/ and web/ both still run from a clean checkout.

Report what you found before making changes. Don't rewrite git history
without asking.
```

---

## 2. Phase 1 — data collection

```
Phase 1 from docs/ROADMAP.md: dataset design. No model training yet.

Help me write docs/DATA-SAWA-001.md covering:
- Capture protocol (distance, lighting, angle, device) — specific enough
  that two people following it produce comparable photos
- Schema for a sample record: image ref, lab pH/N/P/K, soil type if known,
  location, date, capture conditions
- Storage layout and naming convention
- How train/val/test splits will be decided (decided up front, not after
  seeing results)

Constraints: I'm one person with a phone. Assume 50-100 samples is the
realistic first target, not 5000. Don't design infrastructure I won't need
at that scale.
```

---

## 3. Phase 1b — fix the crop database gap

```
See docs/ADR-SAWA-001.md ADR-008: no crop in CROP_DATABASE has a "low"
phosphorus or potassium requirement, so low-P and low-K soils (notably
Sandy) return zero recommendations.

Research crops that genuinely tolerate low-P/low-K sandy soils, with real
agronomic sources for their pH and N/P/K requirements. Show me the sources
and proposed entries before editing CROP_DATABASE. Do not invent values.

Update both backend/server.py and web/src/lib/soil-engine.ts so the two
databases stay identical, and add a note to ADR-008 recording what was
added and why.
```

---

## 4. Phase 2 — first real model

```
Phase 2 from docs/ROADMAP.md. Precondition: I have N real labelled samples
in <path>. If N is under ~30, tell me that's too few and stop.

Build a baseline that predicts pH/N/P/K from image colour features:
- Features: the existing K-Means dominant colours + percentages, plus
  colour statistics (mean/variance per channel, histograms)
- Model: RandomForestRegressor or GradientBoostingRegressor (scikit-learn)
- Cross-validate; report real numbers only
- Compare head-to-head against the current heuristic on the same held-out
  samples, and report the comparison honestly even if the heuristic wins

Do not replace the shipped heuristic yet — build it alongside. Write
docs/AI-SAWA-001.md (design) and docs/VAL-SAWA-001.md (how we know it's
better) as you go, not after.
```

---

## 5. Phase 4 — growth-stage classification

```
Phase 4 from docs/ROADMAP.md. Read ADR-SAWA-001 ADR-004 first — this is
growth-STAGE classification, not chronological age estimation, and the
reasoning for that framing matters.

Before writing code, survey what already exists: public plant phenotyping
datasets, the BBCH growth-stage scale, and published approaches to
stage classification from images. Summarise with sources.

Then propose an approach, assuming a small dataset (transfer learning from
a pretrained backbone rather than training from scratch).
```

---

## 6. Generic bug-fix prompt

```
<describe the bug>

Before fixing: show me the root cause and what else might depend on the
current behaviour.
After fixing: run tsc --noEmit, eslint, and next build (for web/) or
exercise the changed function on real inputs (for backend/), and show me
the actual output.
If the fix changes user-visible behaviour, say exactly how.
```

The last two lines are the important ones. The crop-filter fix changed
which crops appear for every Sandy Soil result — that only surfaced
because behaviour was tested, not just compilation.

---

## 7. End-of-session prompt

```
Update memory.md:
- Move anything completed out of "next action"
- Add a session log row for what actually happened
- Set a single next action, not a list
- Flag anything now stale in the other docs

Then give me a commit message for this session's work.
```
