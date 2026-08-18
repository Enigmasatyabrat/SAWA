# SAWA — Soil Analysis Web App

A showcase site for SAWA, a computer-vision soil analysis pipeline built by
Satyabrat Mishra (B.Tech CSE, AI & ML, ITM GIDA, Gorakhpur). This site is the
**portfolio/marketing front-end for the project** — the Analyzer page runs a
faithful TypeScript port of the actual `backend/server.py` algorithm
(K-Means colour clustering, soil classification, N-P-K/pH prediction, and
crop matching) entirely client-side, so it works without the original
FastAPI + MongoDB backend running anywhere.

The Analyzer also runs a **validation gate** in front of that ported
algorithm: before scoring anything, it checks whether the uploaded photo is
a plausible soil close-up (colour, exposure, resolution, local texture),
rejects images that clearly aren't soil, flags low-evidence images as
Uncertain instead of guessing, and attaches a confidence score plus its
evidence to every result. This is a client-side addition, not part of the
original backend — see `VALIDATION_SYSTEM_PROMPT.md` and `IMPROVEMENTS.md`.

## Stack

Next.js 16 (App Router) - TypeScript - Tailwind CSS v4 - Framer Motion -
Recharts - lucide-react. Configured for **static export**
(`output: "export"` in `next.config.ts`), so the built output is plain
HTML/CSS/JS with no server runtime required.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
```

Static files are written to `out/`. Any static host works.

## Deploying

**Vercel (simplest):** push this folder to a GitHub repo and import it at
vercel.com - it will detect Next.js automatically. No environment variables
are required.

**Netlify / GitHub Pages / any static host:** run `npm run build`, then
upload the contents of `out/` directly. Because this is a static export,
every route needs a host that resolves extensionless paths like `/about` to
`about.html` - Vercel and Netlify both do this by default. If you use a bare
static file server instead, make sure it does the same (`npx serve out` does;
Python's plain `http.server` does not).

## Project structure

```
src/
  app/                 Next.js App Router pages (one folder per route)
  components/          Shared UI: Navbar, Footer, AnalyzerClient, HeroVisual, ...
  lib/
    soil-engine.ts      The ported analysis algorithm (K-Means, classification,
                         nutrient prediction, crop matching) - mirrors
                         backend/server.py exactly. See BUILD_LOG.md #1 for the
                         exact thresholds and why they're trustworthy. Untouched
                         by the validation-gate work - see BUILD_LOG.md #7.
    image-validation.ts  NEW. The validation/confidence gate - pure, DOM-free
                         pixel statistics (colour, exposure, texture,
                         resolution) plus the reject/uncertain/ok decision.
                         See VALIDATION_SYSTEM_PROMPT.md for the full spec
                         this approximates.
    evidence.ts          NEW. Derives soil-type classification confidence from
                         soil-engine's own decision thresholds, without
                         changing them - "how deep inside the matched rule's
                         range is this colour?"
    sample-data.ts       Base64-embedded copy of the project's real
                         sample_soil.jpg test fixture, used by the "use sample"
                         button on the Analyzer page.
```

## BUILD_LOG.md, VALIDATION_SYSTEM_PROMPT.md, IMPROVEMENTS.md

This repo includes `BUILD_LOG.md` - a running log kept during the build of
this site: which facts were pulled from which source file, which decisions
were made and why, and exactly what was tested and how (unit tests, static
analysis, and a full real-Chrome/Playwright pass with screenshots). It's
there for transparency, not required reading to use or deploy the site.

`VALIDATION_SYSTEM_PROMPT.md` is the specification for the Analyzer's
validation gate - written as a proper system prompt for the full, model-backed
version of this check, with a section mapping each of its rules to what
`src/lib/image-validation.ts` actually implements today versus what it can't
(and why). `IMPROVEMENTS.md` is the changelog for that round of work: what
changed, what was tested, and what was deliberately left alone.

## Content honesty note

Numbers on this site are grounded in the actual `backend/server.py` /
`frontend/src/App.js` source code, not the (more optimistic) figures in the
mini-project report - where the two disagreed, the code won. See
`BUILD_LOG.md` #1 for the full list of what was and wasn't used as a source.
