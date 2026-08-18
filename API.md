# SAWA API Reference

Server-side API routes (Next.js App Router Route Handlers) for SAWA v2.

All routes run on the **Node.js runtime** and are `force-dynamic` (executed
per request, never prerendered). This requires the app to be served by a Node
server — see the note on `output: "export"` in [README.md](README.md).

Base URL (local): `http://localhost:3000`

---

## `POST /api/analyze-soil`

Runs the full soil analysis pipeline on an uploaded image and persists the
result to MongoDB.

### Request

`multipart/form-data` with the image under the **`file`** field.

| Constraint | Value |
| --- | --- |
| Field name | `file` (required) |
| Content type | must start with `image/` |
| Max size | 10 MB |
| Formats | anything `sharp` decodes (JPEG, PNG, WebP, AVIF, TIFF, GIF…) |

```bash
curl -X POST -F "file=@soil.jpg" http://localhost:3000/api/analyze-soil
```

### Pipeline

1. Decode with `sharp`, apply EXIF rotation, drop alpha, resize to **150×150**
   with `fit: 'fill'` — matching Plan A's `image.resize((150, 150))` (PIL
   stretches rather than crops).
2. **K-Means** (`k=5`, 10 iterations) → 5 dominant colours + true cluster shares.
3. **Classification** → one of Sandy / Loamy / Clay / Silty / Mixed Soil.
4. **Nutrient heuristic** → pH, N, P, K.
5. **Crop matching** against the 15-crop database → up to 8 crops.

All four steps are imported from [`src/lib/soil-engine.ts`](src/lib/soil-engine.ts),
the same module the client analyzer uses, so the API and UI cannot drift.

### Response `200`

```json
{
  "soil_type": "Loamy Soil",
  "dominant_colors": [[115,91,67],[102,78,54],[128,104,80],[140,116,92],[86,62,38]],
  "color_percentages": [28.15, 25.36, 20.68, 13.07, 12.75],
  "nutrients": { "ph": 6.2, "nitrogen": 59.8, "phosphorus": 54.4, "potassium": 53.7 },
  "recommended_crops": ["Tomato", "Sweet Corn", "Lettuce", "Carrots"],
  "analysis_id": "6a84acc906fea494b72775ec"
}
```

`dominant_colors` and `color_percentages` are index-aligned and sorted by
descending share; percentages sum to ~100.

If the analysis succeeded but the database write failed, the response is still
`200` and additionally carries `storage_warning`, with `analysis_id: null` —
a storage outage never costs the user their result.

### Errors

| Status | Condition |
| --- | --- |
| `400` | Body is not `multipart/form-data` |
| `400` | No `file` field present |
| `400` | `file` is not an `image/*` content type |
| `400` | Image could not be decoded (corrupt / unsupported) |
| `413` | Image exceeds 10 MB |
| `500` | Unexpected server error |

```json
{ "error": "Image could not be decoded — the file may be corrupt or an unsupported format" }
```

### Persistence

Each successful analysis is inserted into `sawa_db.analyses`:

| Field | Type | Notes |
| --- | --- | --- |
| `timestamp` | `Date` | server time of analysis |
| `soilType` | `string` | |
| `dominantColors` | `[number,number,number][]` | 5 RGB triples |
| `colorPercentages` | `number[]` | cluster shares |
| `nutrients` | `object` | `ph`, `nitrogen`, `phosphorus`, `potassium` |
| `crops` | `string[]` | |
| `fileName` / `fileSize` / `contentType` | | upload metadata |

The uploaded image itself is **not** stored. (Plan A stored a base64 copy on
every document; that was dropped deliberately — it bloats documents and
retains user-supplied imagery.)

---

## `GET /api/test-db`

Connection healthcheck used during setup.

```bash
curl http://localhost:3000/api/test-db
```

### Response `200`

```json
{
  "status": "✅ MongoDB connected",
  "database": "sawa_db",
  "collectionsCount": 1,
  "collections": ["analyses"],
  "timestamp": "2026-08-18T19:04:50.393Z"
}
```

Returns `500` with `status: "❌ MongoDB connection failed"` and an `error`
message if the connection or auth fails.

---

## Frontend usage

The analyzer does **not** call `fetch` directly. All frontend→backend traffic goes
through [`src/lib/api-client.ts`](src/lib/api-client.ts):

```ts
import { analyzeSoilWithBackend } from "@/lib/api-client";
const result = await analyzeSoilWithBackend(file); // throws Error with the server's message
```

Order of operations in [`AnalyzerClient.tsx`](src/components/AnalyzerClient.tsx):

1. The **validation gate** runs client-side (it needs the decoded `<img>`, and is a
   presentation concern). If the verdict is `rejected` or `uncertain`, **the API is never
   called** — no point uploading an image already known to be unusable.
2. Only on `ok` is the image POSTed to `/api/analyze-soil`.
3. The snake_case response is mapped onto the engine's `AnalysisResult` shape for rendering.

The bundled sample fixture is flat by design, so `simulateSampleVariance()` is applied and
the varied 150×150 grid is re-encoded as a PNG `File` before upload — the backend therefore
analyzes exactly the pixels the validator inspected.

## Environment

Required in `.env.local` (never committed):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/sawa_db?appName=Cluster0
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

The MongoDB client is cached on `globalThis` in
[`src/lib/mongodb.ts`](src/lib/mongodb.ts) so dev hot-reloads and serverless
invocations reuse one connection pool instead of opening a new one per request.
