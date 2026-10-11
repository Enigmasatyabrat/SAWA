# SAWA Learning Pathway — Phase 2 and beyond

This is deliberately **not** a repeat of `LEARNING_GUIDE.md`, which already
covers the current stack in depth (JavaScript → React → Python → FastAPI →
NumPy → Pillow → K-Means → MongoDB, with a recommended order and curated
resources). Read that one first if any of that is shaky. This document
starts where that one ends: what you need to actually build Phase 2 onward.

Print this alongside `SAWA-Roadmap.docx` — the phases line up.

---

## Before Phase 2: Git & version control (do this first, it's not optional)

You need this before touching an ML pipeline, because model files, datasets,
and experiments multiply fast and you will lose work without it. Full
practical guide: `GIT-GUIDE.md`. Learning-wise, you need:

- What a commit actually is (a snapshot, not a diff) — 15 minutes.
- Branches as "a name for a commit, not a copy of the files" — this is the
  single most misunderstood git concept and the one that unblocks everything
  else once it clicks.
- `.gitignore` — you already have a live example of *why* this matters: the
  zip you uploaded had an 850MB virtual environment in it.

**Resource:** [Learn Git Branching](https://learngitbranching.js.org/) — interactive, visual, free, ~2 hours to go from zero to comfortable.

---

## Phase 1 topic: what makes a dataset usable for ML

You don't need a course for this, you need a checklist mindset:

- **Label quality > label quantity.** 50 soil samples with real lab-verified
  NPK results beat 5,000 photos with no ground truth. The current heuristic
  is already "5,000 photos with no ground truth" in spirit — the whole
  point of Phase 2 is to stop doing that.
- **Consistent capture protocol.** Same rough lighting/distance/angle
  conventions across samples, or the model learns your capture setup
  instead of the soil. Write the protocol down before collecting sample #1,
  not after sample #50.
- **Train/validation/test split, decided before you look at results** — not
  after, or you will unconsciously pick a split that makes your model look
  good.

**Resource:** Andrew Ng's "Machine Learning Yearning" (free PDF) — short,
practical, written specifically for "how do I actually get a model that
works" rather than algorithm theory.

---

## Phase 2 topic: scikit-learn (tabular ML)

You already know NumPy and Pillow from the current codebase — scikit-learn
sits directly on top of that knowledge, it's not a new paradigm.

- `train_test_split`, `RandomForestRegressor`, `GradientBoostingRegressor` —
  this is genuinely most of what you need for ADR-003's Phase 2 v1 model.
- Cross-validation (`cross_val_score`) — how you'll know if 50 samples is
  enough or if you need more before trusting the model.
- Feature importance (`.feature_importances_`) — this will actually teach
  you something scientifically interesting: which color channels/features
  the real data says matter for nutrient prediction, versus the ones the
  original heuristic guessed at.

**Resource:** [scikit-learn's own tutorials](https://scikit-learn.org/stable/tutorial/index.html) — genuinely well-written, skip
the theory-heavy "User Guide" on a first pass and go straight to the
tutorials.

---

## Phase 3–4 topic: computer vision basics (when you get there)

Not needed yet — flagging so you know what's coming and can pace yourself.

- Convolutional Neural Networks, conceptually (you don't need to derive
  backprop, you need to understand what a conv layer is doing).
- Transfer learning — taking a model pretrained on ImageNet (ResNet,
  EfficientNet) and fine-tuning it on your small plant dataset. This is
  *the* standard technique for small-data image problems and is directly
  relevant to growth-stage classification (ADR-004).
- A little of the plant phenotyping literature — not to read like a
  literature review, just enough to know the vocabulary (BBCH scale, leaf
  area index) so you're speaking the same language as anything you cite.

**Resource:** fast.ai's Practical Deep Learning course — free, project-first
rather than math-first, and specifically good at "small dataset, transfer
learning" which is exactly your situation.

---

## Ongoing: MLOps basics (light touch, don't over-invest early)

- Version your datasets and models the same way you version code — even
  just a naming convention (`model_v1_2026-09-01.pkl`) plus a one-line log
  of what changed is enough at this scale. Don't reach for MLflow/DVC until
  the naming-convention approach actually breaks down.
- Keep a simple experiment log (a CSV or even a markdown table: date, model
  version, dataset version, validation accuracy, notes). This is the
  "VAL-SAWA-001" document from the corpus index, eventually — start it as
  a spreadsheet, formalize later.

---

## Suggested pace

Given the project's own history of high-energy bursts (see
`CONVERSATION_INTELLIGENCE_REGISTER.md`), the realistic way to actually get
through this list is small and regular, not all-at-once:

- Git: one sitting, this week.
- Dataset checklist mindset: read once, apply continuously — not a
  separate study session, just keep it in mind while doing Phase 1.
- scikit-learn: a few short sessions over 1–2 weeks, alongside actually
  building Phase 2 (learn-by-building beats learn-then-build here).
- CV/transfer learning: don't start until Phase 3 actually begins. Reading
  about it now, before there's a dataset to apply it to, won't stick.
