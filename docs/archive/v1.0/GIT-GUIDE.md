# Git & Version Control — SAWA

Practical, not theoretical. Exact commands for this project. Your GitHub
profile already exists (`github.com/Enigmasatyabrat`, from the corpus) —
this assumes you have a GitHub account and just need the workflow.

---

## 1. The immediate problem: your zip has 850MB of stuff that should never be in git

The uploaded `SAWA (soil-analysis-app)` folder contains a full `.venv`
(Python virtual environment, ~68,000 files) plus a `.git` folder that's
already tracking things it shouldn't. Fix this first, before anything else.

```bash
cd "SAWA (soil-analysis-app)"

# Check what git currently thinks is tracked
git status

# If .venv or node_modules show up as tracked files, remove them from
# tracking (this does NOT delete the files on disk, just untracks them):
git rm -r --cached .venv
git rm -r --cached frontend/node_modules   # if present
git rm -r --cached frontend/build          # build output, regenerable, don't track it
```

## 2. `.gitignore` — write this once, correctly

Create (or overwrite) `.gitignore` in the project root:

```gitignore
# Python
.venv/
venv/
__pycache__/
*.pyc
.env

# Node
node_modules/
build/
dist/
.env.local

# OS noise
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
.cursor/

# Never commit real credentials — .env.example stays, .env does not
backend/.env
frontend/.env
```

Then:

```bash
git add .gitignore
git commit -m "chore: fix gitignore, stop tracking venv/node_modules"
```

If the repo history already has huge blobs committed (likely, given the
file sizes seen in the zip), a plain `.gitignore` fix stops *future* commits
from including them but doesn't shrink existing history. That's a separate,
optional cleanup (`git filter-repo` or just starting a fresh repo with
current files only) — don't block on it, it's cosmetic.

---

## 3. Basic daily workflow

```bash
# See what changed
git status
git diff

# Stage and commit
git add <files>
git commit -m "type: short description"

# Push to GitHub
git push origin main
```

**Commit message convention** (keeps history scannable later):

```
feat: add real ML nutrient prediction model
fix: correct recommendCrops N/P/K filter logic
docs: add Phase 2 learning pathway
chore: fix .gitignore
refactor: extract soil classification into separate module
test: add unit tests for kmeans clustering
```

---

## 4. Branching — keep it simple

You're a solo developer right now, so don't over-engineer this. One useful
habit: don't commit directly to `main` for anything you're not sure about
yet.

```bash
# Start new work
git checkout -b feature/real-ml-nutrient-model

# ... do the work, commit as you go ...

# When it's working, merge back
git checkout main
git merge feature/real-ml-nutrient-model
git push origin main

# Clean up
git branch -d feature/real-ml-nutrient-model
```

If a phase from the roadmap turns into a multi-week effort (Phase 2 likely
will), a branch per phase is a reasonable unit: `phase-2-real-ml`,
`phase-4-growth-stage`, etc.

---

## 5. Connecting a fresh/cleaned repo to GitHub

If you end up starting a clean repo (recommended, given the history) rather
than cleaning the existing one:

```bash
git init
git add .
git commit -m "chore: initial clean commit"
git branch -M main
git remote add origin https://github.com/Enigmasatyabrat/<repo-name>.git
git push -u origin main
```

---

## 6. Datasets and model files — don't commit these directly

Once Phase 1 (data collection) starts producing real photo+label pairs, and
Phase 2 starts producing trained model files (`.pkl`, `.pt`), do **not**
commit these straight into git — they're binary, they grow fast, and they
bloat the repo the same way `.venv` just did.

Simple approach that's enough at this scale (don't reach for DVC/LFS yet):

```gitignore
# add to .gitignore once Phase 1/2 start
/data/raw/
/data/processed/
*.pkl
*.pt
*.h5
```

Keep a `data/README.md` describing where the real dataset lives (local
folder, cloud bucket, whatever you set up in DATA-SAWA-001) instead of
committing the data itself. Track the *code that produces/loads* the data,
not the data.

---

## 7. One habit worth building now

Commit at the end of every session, even a short one, even if it's not
"done." A commit is a checkpoint, not a finished-feature announcement. This
directly helps the "context loss between sessions" problem `memory.md`
exists to solve — a clean commit history is itself a form of memory.
