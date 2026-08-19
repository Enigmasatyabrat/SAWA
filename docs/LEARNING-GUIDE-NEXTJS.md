# Learning Guide: SAWA v2 Next.js Architecture

## What You're Building

SAWA v2 is a full-stack Next.js application that analyzes soil from photos.

**Architecture: Frontend → API Routes → Database**

- **Frontend (React):** image upload form at `/analyzer`
- **API Routes (Next.js):** `POST /api/analyze-soil` processes images
- **Database (MongoDB):** persists all analyses in `sawa_db.analyses`

## Key Concepts

### API Routes

Next.js App Router API routes are **Route Handlers**. On a Node host they run as
ordinary server handlers; deployed to Vercel they become serverless functions.
File location = URL path:

```
src/app/api/analyze-soil/route.ts  →  POST /api/analyze-soil
src/app/api/test-db/route.ts       →  GET  /api/test-db
```

The exported function name is the HTTP verb: `export async function POST(request)`.

### Static export is incompatible with this

The project originally set `output: "export"` in `next.config.ts`. Under static
export, Route Handlers are evaluated at **build time**, only `GET` is supported,
and handlers may not read the incoming request — so a `POST` endpoint that
receives an upload is impossible. Removing `output: "export"` is what made the
backend possible, and it is why the app now needs a Node runtime rather than a
plain static host.

## How It Works

1. User uploads an image via the frontend form.
2. Frontend validates image quality client-side (**validation gate**).
3. If the gate rejects the image, **the request is never sent** — nothing is uploaded.
4. Frontend calls `POST /api/analyze-soil` with `FormData`.
5. Backend decodes with `sharp`, resizes to 150×150, runs K-Means, classifies the
   soil, and predicts nutrients.
6. Result is saved to MongoDB.
7. JSON response is sent back to the frontend.
8. Frontend maps the snake_case response onto the engine's shape and displays the
   results with confidence and evidence.

### Where the algorithm actually lives

The analysis pipeline is **not** reimplemented in the API. It is imported from
`src/lib/soil-engine.ts`, a faithful TypeScript port of Plan A's
`backend/server.py` (same thresholds, same constants, same math). The API route
and the client analyzer share that one module, so the two cannot drift apart.

## Why This Architecture

| | Plan A (v1) | Plan B (v2, current) |
| --- | --- | --- |
| Stack | React + FastAPI | Next.js (unified) |
| Servers | Two (`:3000` + `:8000`) | One |
| Deployment | Two pipelines | One (Vercel) |
| DevOps | CORS, two hosts, two envs | Single codebase |

Plan B is faster to ship for a solo developer.

## Best Practices Used

1. **Connection caching** — the MongoDB client is cached on `globalThis`, so dev
   hot-reloads and serverless invocations reuse one pool instead of opening a new
   connection per request.
2. **Error handling** — every route has try/catch and returns descriptive errors.
   Client mistakes return `4xx` (bad content type, missing file, undecodable
   image, oversized upload); only genuine server faults return `500`.
3. **Graceful degradation** — if the database write fails, the analysis is still
   returned with a `storage_warning` rather than failing the whole request.
4. **Logging** — console logs at each pipeline stage help debug production issues.
5. **Type safety** — TypeScript throughout, with no `any` types.
6. **Separation of concerns** — components never call `fetch` directly; all
   frontend→backend traffic goes through `src/lib/api-client.ts`.
7. **Validation gate** — image quality is checked client-side *before* the
   expensive API call, so unusable images are never uploaded.
8. **Evidence layer** — soil classification is explained with confidence and the
   metrics behind it, instead of presenting a bare verdict.
9. **Dynamic routes** — `export const dynamic = 'force-dynamic'` ensures handlers
   execute per request instead of being prerendered.

## Content honesty

Site copy makes explicit claims about *where* processing happens. When the
architecture changes, the copy has to change with it. Moving analysis to the
server falsified three existing claims — "nothing is uploaded anywhere",
"nothing leaves your device", and "computed in this tab" — all of which were
corrected in the same commit. Re-check `src/app/*/page.tsx` and
`AnalyzerClient.tsx` after any architectural change.

## Known Limitations

- Nutrient prediction is a **heuristic**, not a trained model. It derives pH and
  N-P-K from colour darkness plus gaussian noise, so repeated runs on the same
  image vary slightly. It is not lab-calibrated.
- The **validation gate is client-side only**. A request sent directly to
  `/api/analyze-soil` bypasses it entirely.
- **Analyses are written but never read back** — there is no history endpoint yet.
- The **bundled sample fixture is flat** by design, so simulated variance is
  applied before it is analyzed.

## Future Improvements (Phase 1+)

- Collect real soil samples with lab-verified results
- Train an ML model to replace the heuristic nutrient prediction
- Add image preprocessing/compression
- Implement caching for frequently analyzed soils
- Add authentication for user accounts
- Add a history endpoint (`GET /api/analyses`)
- Enforce the validation gate server-side as well as client-side
- Deploy to Vercel for global distribution

## See also

- [`API.md`](../API.md) — endpoint reference (request/response shapes, errors)
- [`RELEASES.md`](../RELEASES.md) — version history
- [`VALIDATION_SYSTEM_PROMPT.md`](../VALIDATION_SYSTEM_PROMPT.md) — the gate's spec
- [`BUILD_LOG.md`](../BUILD_LOG.md) — how the showcase site was built and verified
