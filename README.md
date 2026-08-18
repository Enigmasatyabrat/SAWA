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
Recharts - lucide-react - MongoDB - sharp.

This is a **full-stack** app: it exposes server-side API routes backed by
MongoDB (see [API.md](API.md)). It was previously a static export
(`output: "export"`), which was removed because static export only supports
build-time `GET` handlers and forbids reading the incoming request — making a
`POST` analysis endpoint impossible. The app therefore needs a Node runtime
and can no longer be served as plain static files.

## Local development

```bash
npm install
```

Create `.env.local` in the project root (it is gitignored — never commit it):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/sawa_db?appName=Cluster0
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

```bash
npm run dev
```

Open `http://localhost:3000`. Verify the database with
`curl http://localhost:3000/api/test-db`.

## Production build

```bash
npm run build
npm run start
```

## Deploying

**Vercel (simplest):** push this folder to a GitHub repo and import it at
vercel.com - it will detect Next.js automatically. Set `MONGODB_URI` in the
project's environment variables; the API routes will not work without it.

**Any Node host:** run `npm run build` then `npm run start`. A purely static
host (GitHub Pages, plain file servers) is no longer sufficient, because the
API routes need a server at request time.

## Project structure

```
src/
  app/                 Next.js App Router pages (one folder per route)
    api/
      analyze-soil/     NEW. POST endpoint: image -> K-Means -> classification
                         -> nutrients -> crops, persisted to MongoDB. Uses the
                         real soil-engine functions, not a reimplementation.
      test-db/          NEW. MongoDB connection healthcheck.
  components/          Shared UI: Navbar, Footer, AnalyzerClient, HeroVisual, ...
  lib/
    mongodb.ts          NEW. Cached MongoClient shared by all API routes.
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
