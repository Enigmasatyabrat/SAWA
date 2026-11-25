# BIZ-SAWA-001
# Business Model, Market & Go-to-Market

---

## Document Control

| Field | Value |
|---|---|
| Document ID | BIZ-SAWA-001 |
| Version | 1.0.0 |
| Status | Strategy draft — every price and volume below marked **D** is a hypothesis to test, not a forecast |
| Created | 11 October 2026 |
| Depends on | LIT-SAWA-001, HW-SAWA-001, ADR-009 … 011, 015 |

---

## 1. One-paragraph thesis

India already tests soil at enormous scale — 25 crore Soil Health Cards from
8 crore samples (L-13) through 8,272 labs (L-20) — and has standardised what a
result looks like (12 parameters, fixed methods and bands; L-14 – L-16) and how
to turn it into fertiliser doses (STCR, L-21). What it lacks is **cheap,
fast, decentralised measurement** and **advice the farmer can actually read and
act on**. SAWA's opportunity is not "AI that reads soil from a photo" (it can't,
L-10 – L-12). It is: **the phone as the lab instrument** (reagent chemistry read
by the camera or a ₹2–4k dongle, HW-SAWA-001) plus **the phone as the
agronomist** (SHC-unit results → cited STCR fertiliser plan, in Hindi, offline).

---

## 2. Market facts (cited)

| Fact | Value | Source | Conf. |
|---|---|---|---|
| Soil Health Cards issued | > 25 crore (July 2025) | L-13 | B |
| Samples tested 2015–2025 | 8.03 crore | L-13 | B |
| Cards issued in 2024-25 | 53.08 lakh (up from 16.84 lakh in 2020-21) | L-13 | B |
| Government soil labs | 8,272 (incl. 6,376 mini, 665 village-level) | L-20 | B |
| Central payment per sample | ₹190 | L-20 | B |
| Private / KVK test price | ₹200–500 | L-20 | B |
| Reissue cycle | every 3 years | L-20 | B |
| **Village-Level Soil Testing Lab (VLSTL) grant** | one-time **₹1.5 lakh** (75 % of ₹2 lakh) to rural youth 18–27, SHGs, Krishi Sakhis, agri students; under RKVY (2025) | [egovtschemes](https://www.egovtschemes.com/rkvy-soil-health-and-fertility-village-level-soil-testing-lab/); [Bihar notice](https://shikshabindu.com/bihar-soil-testing-lab-scheme-2025/) | B |
| School Soil Health Programme | 1,000 school labs, 1,021 schools (July 2025) | [PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/aug/doc2025816613501.pdf) | C |
| Smartphones | 85.5 % of households; Android ≈ 93 % | L-38, L-39 | B |

---

## 3. Competitors and precedents

| Player | Offer | Price point | Model | What SAWA learns |
|---|---|---|---|---|
| **Krishitantra** (Hyderabad, 2017) — KrishiRASTAA; Bhu-Vision with ICAR-IIRR | Portable IoT lab, 12 parameters in ~30 min, auto recommendations | ~₹250 per 11-parameter test (older source); ~$1.18 M raised (Omnivore, NABVentures) | **B2B** to FPOs, agribusiness, labs; 250+ installations, 35,000 tests (older figure) | B2B through intermediaries is the proven channel. [AgFunder](https://agfundernews.com/soil-testing-startup-krishitantra-secures-1m-seed-capital-from-omnivore-nabventures) |
| **Bhu-Parikshak** (IIT Kanpur → AgroNxt/ScaNxt) | NIR, 90 s, 6 params, Android app | device ₹1,17,410 + per-test fee | Hardware + platform fee | NIR is fast but expensive; per-test platform fee is accepted (L-29) |
| **Mridaparikshak** (ICAR-IISS / Nagarjuna Agrochemicals) | Colorimetric mini-lab, 12 params | ₹50k–1L; refills ~₹110/test | Govt procurement (5,000+ kits via NAFED) | Chemistry + reader works at 90 %+ (L-32); refills are the business |
| Rapid soil test kits (many vendors) | Colour-chart NPK kits | ₹800–6,100 | Retail | Cheap but read by eye — the error SAWA's camera reader removes (L-31) |
| BharatAgri, DeHaat, AgroStar | Advisory / inputs, incl. soil testing | free app, paid services, input margin | Platform + commerce | Advisory alone is crowded; measurement is the moat |
| Plantix and others | Leaf disease from photos | free | Ads / input commerce | Disease is crowded — keep it a later module (ADR-016) |
| GitHub look-alikes (THE_MRIDANSH, AgriGrow Sense, many RS485 NPK projects) | Prototypes | — | — | None combines phone-as-instrument + SHC units + STCR + validation (LIT §8) |

**Differentiation SAWA can defend:** lowest capital cost per test point (the
phone replaces the reader), SHC-native results, cited STCR advice, Hindi-first
offline UX, and **published validation** — honesty as a feature in a market of
overclaiming NPK probes.

---

## 4. Products and revenue model

Think glucometer: **cheap reader, recurring consumable, useful software**.

| Product | Who uses it | Price hypothesis | Conf. |
|---|---|---|---|
| **SAWA app — free** | Any farmer | Free: enter/scan your SHC → Hindi crop + fertiliser plan (STCR), field history, reminders when the card is due | — |
| **SAWA Lab** (software) | VLSTL operators, FPO labs, school labs | ₹2,000–6,000 / year: sample register, GPS, batch reagent calibration, SHC-format report generation, STCR, farmer SMS/WhatsApp share | D |
| **SAWA Lens kit** (HW-0) | VLSTL, FPOs, KVK outreach, progressive farmers | ₹1,500–3,000 starter (cradle, scale, vials, 25-test reagent pack) | D |
| **SAWA Probe** (HW-1) | Labs needing throughput and pH/EC | ₹4,000–8,000 | D |
| **Reagent refills** | All kit users | ₹100–150 per N-P-K-pH panel (target COGS ≤ ₹60) | D |

### Unit economics sketch (all **D** — to be replaced by real quotes and pilot data)

| Assumption | Value |
|---|---|
| Refill price / COGS per test | ₹120 / ₹55 → ₹65 gross |
| Tests per active VLSTL per year | 1,000 |
| Software per lab per year | ₹3,000 |
| **Gross per active lab per year** | ≈ ₹68,000 |
| 100 active labs | ≈ ₹68 lakh / year gross |

What makes this credible for the lab owner: the government pays ₹190–300 per
sample for SHC work and farmers pay ₹200–500 privately (L-20), so a ≤ ₹150
consumable cost per test leaves the operator a margin. **Validate this with
three real VLSTL operators before building more hardware.**

---

## 5. Customer segments, in order of attack

1. **Village-Level Soil Testing Labs** — funded by the ₹1.5 lakh grant, run by
   18–27-year-olds who are smartphone-native, and obliged to produce SHC-format
   output. SAWA Lab + Lens fits inside their grant budget. *Primary target.*
2. **FPOs** — buy for members; want soil testing as a member service.
   Krishitantra's evidence says this channel pays.
3. **KVKs and school soil labs** — credibility, training multiplier, and
   validation partners (they own lab instruments for SV-005).
4. **Agri-input dealers** — test-then-recommend at the counter; sensitive to
   conflict of interest, so later.
5. **Individual farmers** — free app; paid kits only for progressive farmers.

---

## 6. Go-to-market (first 12 months, Gorakhpur division)

| Quarter | Milestone | Evidence it worked |
|---|---|---|
| Q1 | Free app with SHC entry → STCR plan (no hardware), Hindi | 50 farmers enter a real card; plans checked by an agronomist |
| Q1 | Phase 1A/1B data pilot (20 samples, lab results) | Manifest complete with lab IDs |
| Q2 | HW-0 prototype; SV-005 on 30–50 soils with a partner lab | Class agreement beats the visual-kit baseline |
| Q2 | Interviews with 3–5 VLSTL operators and 2 FPOs | Written willingness-to-pay at a stated price |
| Q3 | Pilot: 3 labs use SAWA Lab + Lens for real samples | ≥ 300 tests logged; repeat refill orders |
| Q4 | Apply for NIDHI-PRAYAS / RKVY-RAFTAAR with pilot data | Grant secured or specific rejection feedback |

---

## 7. Funding path (non-dilutive first)

| Scheme | Amount | Fit | Source |
|---|---|---|---|
| **NIDHI-PRAYAS** (DST) | up to ₹10 lakh, ≤ 18 months, prototype; individuals and students eligible | HW-0 → HW-1 prototype | [Startup India](https://www.startupindia.gov.in/content/sih/en/ams-application/incubator-program.html?applicationId=61b9919ee4b0363880caf1ac) |
| **RKVY-RAFTAAR** (MoA&FW) via an R-ABI | student up to ₹4 lakh; pre-seed up to ₹5 lakh (90 %); seed up to ₹25 lakh (85 %) | Agri-specific; R-ABI at **IIT BHU, Varanasi** is the nearest | [RKVY-RAFTAAR IIT BHU](https://rkvy-raftaariitbhu.org/idea-pre-seed-stage-funding/) |
| **Startup India Seed Fund** (DPIIT) | up to ₹20 lakh grant + up to ₹50 lakh debt | After incorporating a DPIIT-recognised startup | [SISFS](https://www.bajajfinserv.in/startup-india-seed-fund-scheme) |
| VLSTL scheme (indirect) | ₹1.5 lakh per lab, paid to the operator | Customers' budget — not SAWA's money | §2 |

Note: SISFS excludes startups that already received more than ₹10 lakh from
other central/state schemes — sequence applications deliberately.

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Camera reading doesn't beat visual kits | M | H | HW-1 photodiode reader; SV-005 gate before spending more |
| Reagent supply, shelf life, safety | M | H | Two suppliers; batch calibration; MSDS and Hindi safety sheet (HW §6) |
| Government SHC is free | H | M | Sell to the labs doing government work, not against them |
| Data legality (SHC scraping, farmer data under India's DPDP Act 2023) | M | H | Consent-first design; no bulk scraping until terms reviewed (DATA §4) |
| Overclaiming erodes trust | M | H | ADR-020 claims policy; publish validation |
| Founder bandwidth (student, solo) | H | H | Software-first phases need no hardware; one phase at a time (SP-007) |
| Naming collisions | H | L | "Bhoomi", "Bhu-…" are crowded (Bhu-Parikshak, Bhu-Vision, a `Bhoomi-ai` repo); trademark search before any rename |

---

## 9. What has to be true (and how we'll know)

1. VLSTL operators will pay for software + refills → interviews (Q2), pilot repeat orders (Q3).
2. Phone-read chemistry reaches lab-class agreement → SV-005.
3. Farmers act on STCR plans delivered in Hindi on a phone → SV-006 usability + follow-up.
4. Unit cost per test ≤ ₹60 at small scale → real reagent quotes before Q2.

If (1) fails, SAWA remains a strong free advisory app and a portfolio/research
project — still a good outcome. If (2) fails, HW-1's reader becomes mandatory
and the hardware budget rises.
