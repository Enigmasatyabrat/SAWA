# API-SAWA-001
# API Specification — v3 target surface

---

## Document Control

| Field | Value |
|---|---|
| Document ID | API-SAWA-001 |
| Version | 1.0.0 |
| Status | Target design. The **current** v2 API is documented in `/API.md` and remains authoritative for what is deployed. |
| Created | 11 October 2026 |
| Depends on | SYS-SAWA-001 (data model), ADR-010, ADR-011, ADR-019 |

---

## 1. Conventions

- Prefix: `/api/v3/`. The v2 route `POST /api/analyze-soil` stays as a
  labelled legacy demo (ADR-009); `GET /api/test-db` is retired with MongoDB
  (ADR-013) and replaced by `GET /api/v3/health`.
- **Every quantity is an object, never a bare number:**
  `{ "value": 312, "unit": "kg/ha", "parameter": "N", "source": "shc_card", "method": "KMnO4", "rating": "Medium" }`.
  This is the API-level form of ADR-010 — a bare `"nitrogen": 59.8` can never
  appear again.
- Estimates carry their uncertainty: `"rating_set": ["Low","Medium"]` or
  `"interval": [0.42, 0.61]`.
- Errors: `{ "error": { "code": "OUT_OF_RANGE", "message": "...", "field": "..." } }`.
- Auth: phone OTP → bearer token. Advisor endpoints also work unauthenticated
  for one-off use (nothing is stored).

---

## 2. Endpoints

### Advisor (no ML — ships first)

`POST /api/v3/advice` — measurements in, plan out. Stateless.

```json
{
  "district_code": "UP-GKP",
  "crop": "wheat",
  "yield_target_q_ha": 40,
  "measurements": [
    { "parameter": "N", "value": 150, "unit": "kg/ha", "method": "KMnO4" },
    { "parameter": "P", "value": 10,  "unit": "kg P2O5/ha", "method": "Olsen" },
    { "parameter": "K", "value": 90,  "unit": "kg K2O/ha", "method": "NH4OAc" }
  ]
}
```

```json
{
  "doses_kg_ha": { "N": 174, "P2O5": 108, "K2O": 61 },
  "equation": {
    "id": "stcr-wheat-pusa-yacs-1",
    "centre": "RAU Pusa (Bihar)",
    "soil": "Young alluvium calcareous",
    "match": "nearest_validated_centre",
    "source": "ICAR-IISS STCR compendium, p. 76"
  },
  "products": [
    { "name": "DAP (18-46-0)",  "kg_ha": 234 },
    { "name": "Urea (46-0-0)",  "kg_ha": 286 },
    { "name": "MOP (0-0-60)",   "kg_ha": 101 }
  ],
  "disclosures": [
    "No STCR equation is published for your district; using the nearest validated centre on the same alluvium."
  ],
  "ratings": { "N": "Low", "P": "...", "K": "..." },
  "versions": { "equations": "2026.10.1", "bands": "SHC-2026.10" }
}
```

*(Doses are the Pusa wheat equation at T = 40, SN = 150, SP₂O₅ = 10,
SK₂O = 90; the compendium's reckoner prints 174/108/61 for that row — LIT L-23.
Products assume DAP supplies all P₂O₅ and part of the N (234 kg × 18 % = 42 kg N),
urea the remaining N, MOP all K₂O; the N from DAP + urea sums back to the
174 kg/ha dose. Bag counts are left to the client, because bag sizes vary
(urea is commonly sold in 45 kg bags) — never hard-code them.)*

`GET /api/v3/crops` · `GET /api/v3/bands?scheme=SHC` · `GET /api/v3/equations?crop=wheat&district=UP-GKP`
— reference data the device caches for offline use.

### Samples and measurements (authenticated, sync)

| Method & path | Purpose |
|---|---|
| `POST /api/v3/fields` | Create field (geometry coarsened server-side unless research consent) |
| `POST /api/v3/samples` | Register a physical sample |
| `POST /api/v3/samples/{id}/measurements` | Append measurements (batch); idempotent by client UUID |
| `GET /api/v3/samples/{id}` | Sample with all measurements and their provenance |
| `POST /api/v3/shc/import` | A full card (12 parameters + metadata), entered or OCR'd then **confirmed by the user** |
| `POST /api/v3/sync` | Outbox flush: `{ client_ops[] }` → `{ accepted[], rejected[], server_changes[] }` |

### Image analysis

`POST /api/v3/images/analyze` — multipart image. Server re-runs the quality
gate (ADR-019). Returns colour, Munsell, moisture class and, **only once its
model has passed VAL SV-003**, an OC rating set. Never returns N, P or K.

```json
{
  "quality": { "usable": true, "reasons": [] },
  "card_detected": true,
  "munsell": { "notation": "10YR 4/3", "calibrated": true },
  "moisture": { "rating_set": ["Moist"] },
  "oc": { "rating_set": ["Low", "Medium"], "model": "m2-oc@1.0.0" }
}
```

### Hardware readings

`POST /api/v3/kit/readings` — HW-0 (image of blank/standard/sample) or HW-1
raw counts; server or device computes concentration with the batch curve and
returns `measurement` objects with `source: "kit" | "probe"`.

### Region context

`GET /api/v3/regions/{district_code}/profile` — distribution (median, IQR, n)
of each parameter from **consented** data only; returns `n` so the UI can say
"based on 37 samples" or "not enough data yet".

---

## 3. Versioning and deprecation

- Breaking changes → `/api/v4/`. Reference-data versions (`equations`, `bands`,
  models) are reported in every advice response so old results stay explainable.
- `/api/analyze-soil` returns a `Deprecation` header and a link to the v3 flow
  once F-1 ships.
