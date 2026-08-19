# SAWA Releases

## v2.0.0 — Next.js Full-Stack (2026-08-19)

**Major rewrite:** migrated from Plan A (React + FastAPI) to Plan B (Next.js unified).

### What's New

- ✅ Unified full-stack Next.js architecture (removed `output: "export"`, which
  had made server-side API routes impossible)
- ✅ API routes for soil analysis at `POST /api/analyze-soil`
- ✅ MongoDB integration for data persistence (`sawa_db.analyses`)
- ✅ Reused the existing K-Means / classification / nutrient / crop port of Plan A
  (`src/lib/soil-engine.ts`) as the single source of truth shared by API and UI
- ✅ Frontend delegates all analysis to the backend via `src/lib/api-client.ts`
- ✅ Client-side validation gate retained — it now gates whether the API is
  called at all, so rejected images are never uploaded
- ✅ Evidence layer explaining soil classification retained
- ✅ End-to-end integration tested in a real browser and working
- ✅ Phase 1 scaffolding (data collection structure)
- ✅ Phase 2 scaffolding (ML training framework)
- ✅ Site copy corrected where it no longer matched the architecture

### Why This Version

- Simpler deployment (Vercel)
- One codebase instead of two
- No separate backend/frontend DevOps, no CORS layer
- Better for a solo developer
- Keeps the validation gate + evidence layer (UX features that predate the migration)

### Migration from v1

See [README.md](README.md) § Architecture for the explanation and links to Plan A.

### Known Limitations

- Nutrient prediction uses a **heuristic**, not ML. It derives pH/N-P-K from
  colour darkness plus gaussian noise, so results vary slightly between runs on
  the same image, and are not lab-calibrated.
- The **validation gate is client-side only** and can be bypassed by posting
  directly to the API.
- **No history endpoint yet** — analyses are stored but not queryable.
- K-Means seeding uses `Math.random()`, so dominant colours can shift slightly
  between runs (Plan A used a fixed `random_state=42`).
- Hosting now requires a Node runtime; a plain static host is no longer sufficient.
- Two high-severity transitive npm audit advisories are outstanding.

### Next: Phase 1

Data collection from real soils with lab-verified results.
See `data/samples/manifest.csv` for the collection schema.
