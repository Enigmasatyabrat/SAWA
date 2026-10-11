# LIT-SAWA-001
# Literature & Evidence Review — what a phone, a sensor, and a lab can each actually tell you about soil

---

## Document Control

| Field | Value |
|---|---|
| Document ID | LIT-SAWA-001 |
| Version | 1.0.0 |
| Status | Written — evidence frozen as of 11 Oct 2026 |
| Depends on | nothing — every other SAWA-REC v2 document depends on this one |
| Confidence scale | **A** verified by execution or against a primary source · **B** corroborated by ≥2 independent sources · **C** single credible source · **D** inference, needs validation |

Every claim below carries an evidence ID (`L-xx`) so other documents can cite it
precisely. Where a source reports a number, the number is quoted, not rounded
into something friendlier.

---

## Why this document exists

SAWA v2 presents pH, nitrogen, phosphorus and potassium "read" from a soil
photograph. The v1.0 corpus already said plainly that those numbers come from a
hand-tuned darkness heuristic, not a model (ADR-SAWA-001; SP-001). The open
question going into v3 was different: **if SAWA collected real data and trained
a real model, which of those outputs could a phone camera ever estimate well?**

The short answer, developed below: organic carbon and things you can see
(colour, moisture, texture class) — yes, within limits. Available N, P and K
from an ordinary photo — no, not to a standard anyone should fertilise by.
Getting N/P/K needs chemistry (a reagent the phone can read), an
electrochemical sensor, a spectrometer, or a lab. That single finding drives
ADR-009 and most of the v3 architecture.

---

## 1. Smartphone colour → soil organic carbon / organic matter

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-01 | Controlled smartphone studies predict SOM/SOC with validation **R² ≈ 0.58–0.88**; a few lab studies exceed 0.9. | Synthesis of the studies below | B |
| L-02 | Reflectance-image sub-colour-space features + stacked ML: **R² = 0.88, RMSE 0.28 %** on original images; **R² = 0.79** on deliberately perturbed images. | [Biosystems Eng. 2021](https://www.sciencedirect.com/science/article/abs/pii/S1537511021001422) | C |
| L-03 | **Indo-Gangetic Plains**, 611 samples, iPhone 11 under controlled illumination, Random Forest: **R² = 0.58**; lower illumination (300 lx) improved accuracy. *This is SAWA's own region (Gorakhpur is in the IGP).* | via [Comput. Electron. Agric. 2025](https://www.sciencedirect.com/science/article/abs/pii/S0168169925013857) | C |
| L-04 | Smartphone imagery **+ topographic features**, XGBoost: **R² = 0.717**, CCC 0.82 (Indo-Gangetic Plains). | [Comput. Electron. Agric. 2025](https://www.sciencedirect.com/science/article/abs/pii/S0168169925013857) | C |
| L-05 | **Five different phones**, 70 soils: R² 0.68–0.77 each, **but colour differences between phones hurt cross-device transfer**. | [Yang et al., Geoderma 2021](https://www.sciencedirect.com/science/article/abs/pii/S0016706121004456) | C |
| L-06 | **Soil moisture > 10 % significantly reduces accuracy** unless moisture is modelled explicitly; moist soils correlate better with brightness than dry. | Fu et al. 2020, via [PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10328891/) | B |
| L-07 | **Grey-card / darkroom calibration greatly reduces cross-sensor bias**; best phone result within 2 % of a hyperspectral benchmark (iron oxides, R² 0.64 vs 0.65). | [Precision Agric. 2025](https://link.springer.com/article/10.1007/s11119-025-10270-0) | C |
| L-08 | Models **transferred to a different region** dropped to **R² 0.20–0.50**. | via [PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10328891/) | C |
| L-09 | CIELab colour indices correlate with SOC (**R² = 0.92**, Viscarra Rossel et al. 2008); RGB camera + RF gave R² 0.85 (Gholizadeh et al. 2020). | cited in [Biosystems Eng. 2021](https://www.researchgate.net/publication/353151482) | C |

**Implication for SAWA.** A calibrated, moisture-aware colour model trained on
*local* lab-paired samples can plausibly classify organic carbon into the Soil
Health Card's Low/Medium/High bands. Three things are non-negotiable, each
backed by evidence above: a reference colour card in frame (L-05, L-07),
recorded moisture (L-06 — Phase 1A already captures `moisture_visual`), and
local training data (L-08). A model trained elsewhere and shipped to Gorakhpur
should be expected to fail.

---

## 2. Smartphone RGB → available N, P, K

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-10 | Plain RGB photos are mainly informative about **visible** properties (colour, texture, organic matter, moisture), not nutrients directly — soil colour is driven primarily by SOM and moisture. One smartphone-RGB study reported SVR at **slightly over 40 % R²** for physico-chemical properties (negative for physical ones) and CNNs below 80 %. *Primary paper for the 40 % figure not yet pinned — found via search synthesis; re-locate before quoting externally.* | [Texture from smartphone images](https://www.sciencedirect.com/science/article/abs/pii/S0016706120310958); [PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10328891/) | B (principle) / C (the 40 % figure) |
| L-11 | Even with **hyperspectral** imaging, available **P is consistently the hardest** nutrient; Vis-NIR "is not appropriate for … available P or soil pH" in one review; K and Na are among the hardest for NIR. | [Hyperspectral N/P 2026](https://link.springer.com/article/10.1007/s11119-026-10323-y); [PMC8235466](https://pmc.ncbi.nlm.nih.gov/articles/PMC8235466/) | B |
| L-12 | Best-case hyperspectral total-N results reach R² ≈ 0.8–0.94 — with a lab spectrometer, not a phone camera. | same | B |

**Implication.** There is no credible path from an ordinary phone photo to an
available-N/P/K number that a farmer should act on. SAWA v3 stops displaying
photo-derived N/P/K as if they were measurements (ADR-009). Nitrogen is the
least-bad of the three, phosphorus the worst — the opposite of what a "four
signals predicted" headline implies.

---

## 3. India's Soil Health Card (SHC) data — the ground truth that already exists

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-13 | **Over 25 crore cards** issued (July 2025) from **8.03 crore samples** (2015–2025); annual issuance rose from 16.84 lakh (2020-21) to 53.08 lakh (2024-25). | [PIB factsheet Aug 2025](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/aug/doc2025816613501.pdf); [IMPRI](https://www.impriindia.com/insights/policy-update/soil-health-card-scheme-sustainability/) | B |
| L-14 | **12 parameters** per card: N, P, K, S; Zn, Fe, Cu, Mn, B; pH, EC, OC. Cards carry GPS coordinates, soil type, per-parameter rating and normal range, and crop-specific fertiliser combinations. | [PIB](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155036&reg=3&lang=2); schema in [`google-research-datasets/india-soil-health-card` card.proto](https://github.com/google-research-datasets/india-soil-health-card) (Apache-2.0) | A |
| L-15 | **Rating limits** (kg/ha unless noted): available N Low < 280, Medium 280–560, High > 560; available P < 10, 10–25, > 25; available K < 108, 108–280, > 280; OC < 0.5 %, 0.5–0.75 %, > 0.75 %. A second chart in use (TNAU) differs for N (240/480) and P (11/22). Labs may print P as P₂O₅ (×2.29) and K as K₂O (×1.2), which changes the limits. | [agri.bot](https://agri.bot/soil-health), [Katyayani](https://www.katyayaniorganics.com/blog/soil-health-card-kaise-padhe), [TNAU](https://agritech.tnau.ac.in/agriculture/agri_soil_soilratingchart.html) | B |
| L-16 | Standard SHC lab methods: Subbiah & Asija (alk. KMnO₄) for N, Olsen / Bray-1 for P, neutral normal NH₄OAc for K, DTPA for micronutrients, Walkley-Black for OC (ICAR-IISS protocols). | same as L-15 | B |
| L-17 | A bottom-up database of **20,629,849 records** (611 districts, 190,852 villages): **> 75 % of records scored reliable**; SHC **pH agrees** with global SoilGrids across scales, **OC and N differ significantly**. | [AGU 2023 abstract](https://ui.adsabs.harvard.edu/abs/2023AGUFMGC14...09P/abstract) | C |
| L-18 | A 39-million-measurement SHC study: SoilGrids OC was **> 2× SHC** in 16 of 19 agro-ecological regions; GSDE about **half**. Global soil maps are not a substitute for SHC data in India. | [PubMed 41860640](https://pubmed.ncbi.nlm.nih.gov/41860640/) | C |
| L-19 | Data-access caveats: sample-level and district-level counts disagree for some districts; ML use is limited by standardisation and accessibility. No official bulk download — Google Research built a scraper (`MSAnalysis/` contains their reliability-scoring R scripts). | [Sci. Rep. 2023](https://www.nature.com/articles/s41598-023-39084-8); [arXiv 2603.15085](https://arxiv.org/pdf/2603.15085) | B |
| L-20 | Government pays states **₹190 per sample**; KVK/private labs charge **₹200–500**; a card is meant to be reissued every **3 years**. **8,272 labs** (Feb 2025: 1,068 static, 163 mobile, 6,376 mini, 665 village-level). | [PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/aug/doc2025816613501.pdf) | B |

**Implication.** India has already paid for the hard part — tens of millions of
lab-tested, geotagged samples in a fixed 12-parameter format. Two product
consequences: (1) SAWA's numbers must be in SHC units and SHC rating bands, or a
farmer cannot compare them with the card in their hand (ADR-010); (2) the
cheapest genuinely useful SAWA feature needs no ML at all — turn the farmer's
existing card into a crop and fertiliser plan (ADR-011).

---

## 4. Fertiliser prescription science — ICAR STCR

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-21 | ICAR's AICRP on Soil Test Crop Response publishes **targeted-yield equations** of the form `FN = a·T − b·SN` (likewise P₂O₅, K₂O; optional organic-manure term). `T` = yield target (q/ha); `SN, SP, SK` = soil test values (kg/ha). | [AICRP-STCR](https://aicrp.icar.gov.in/stcr/activities/); [ICAR-IISS compendium](https://iiss.res.in/old/downloads/stcr%20Crop%20wise%20Recommendations.pdf) | A |
| L-22 | The compendium *Four Decades of STCR Research — Crop-wise Recommendations* holds **61 rice and 29 wheat** equations, but **no Uttar Pradesh centre**. Nearest agro-ecology to Gorakhpur: **RAU Pusa (Bihar)** and **Pantnagar (Uttarakhand)**. | compendium crop index (text extracted and read this session) | A |
| L-23 | **Verified example.** Pusa wheat, young alluvium calcareous soil (valid for East/West Champaran, Siwan, Saran, Gopalganj …): `FN = 5.95T − 0.43SN`, `FP₂O₅ = 3.03T − 1.34SP₂O₅`, `FK₂O = 3.16T − 0.73SK₂O`; maintenance minimum 30/15/10 kg/ha. Re-implemented here, it **reproduces the compendium's own ready-reckoner table** — e.g. soil (120, 4, 60) → 127/86/51 at 30 q/ha and 186/116/83 at 40 q/ha; mid-table rows within ±1 kg/ha rounding. | compendium p. 76–77 (PDF pp. 82–83) | A |
| L-24 | The compendium flags quality per equation — the **same soil's** Zn-inclusive equation set is marked **"Equations not upto the mark."** Software must use only equations flagged good. | compendium PDF p. 83 | A |
| L-25 | UP-specific STCR work exists outside the compendium (BHU Varanasi centre): rice cv. Saryu-52 validation; mustard, oat, pea, maize equations for eastern-UP alluvium. Validity criterion: actual yield within **±10 %** of target. | [IISS e-magazine](https://iiss.res.in/old/eMagazine/v4i1/7.pdf); [ISSS](https://www.isss-india.org/downloads/10-Rishi-Ranjan.pdf) | B |

**Implication.** Fertiliser advice can be **deterministic, cited, and
unit-tested against official tables** — exactly the opposite of a heuristic.
Every equation SAWA ships carries a source record (centre, soil, valid
districts, page) and a test that reproduces its published reckoner (VAL SV-004).

---

## 5. Low-cost sensors — what each principle can and cannot measure

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-26 | Cheap **RS485 "7-in-1" NPK probes** (JXCT and clones, ~₹7,000) appear to compute N, P and K by linear transforms of **one conductivity reading**; three independent quantities cannot be recovered from one measurement. An independent comparison found readings that agree with each other but **correlate poorly with the lab**; every positive study **calibrated against local lab data**. | [Arduino forum](https://forum.arduino.cc/t/rs485-soil-npk-sensor-calibration/1302235); [ResearchGate comparison](https://www.researchgate.net/figure/Comparison-of-measurement-results-with-analog-NPK-meters_tbl1_349316730); [WCSE 2023](https://www.wcse.org/WCSE_2023/039.pdf); [Dharwad 2026, SHC-calibrated XGBoost](https://www.sciencedirect.com/science/article/pii/S2772375526008075) | B |
| L-27 | **MEMS FT-NIR (NeoSpectra, 1350–2550 nm)**: SOM and total N R² > 0.75 (paddy soils); OC R² 0.78 vs 0.89 for a lab ASD; pH/texture weaker (R² 0.48–0.53); models **don't transfer between units** without calibration transfer. | [Sensors 2026](https://doi.org/10.3390/s26061805); [Sharififar 2019](https://bsssjournals.onlinelibrary.wiley.com/doi/abs/10.1111/sum.12537) | B |
| L-28 | **AS7265x (18-ch, 410–940 nm, ~$65)**: validated on leaves and liquids, little on soil; it **misses 1400–2500 nm**, where SOM and clay absorb. | [MDPI Sensors 2025](https://www.mdpi.com/1424-8220/25/7/2198); [ResearchGate](https://www.researchgate.net/publication/362565142) | B |
| L-29 | **IIT Kanpur Bhu-Parikshak** (NIR; N, P, K, OC, clay, CEC; 5 g dry soil, 90 s; Bluetooth + USB to an Android app): listed at **₹1,17,410**, licensed to AgroNxt, on sale since May 2022. | [IIT Kanpur](https://www.iitk.ac.in/soil-testing-device); [IndiaMART listing](https://www.indiamart.com/proddetail/agronxt-bhu-parikshak-a-smart-soil-testing-device-2852768310630.html) | B |
| L-30 | **Phone-camera colorimetry** of extracted soil: SMART NP (nitrate, phosphate; 3D-printed housing on the rear camera) **≤ 1 % bias, ~2 % RSD** vs a lab spectrophotometer; a light-tight LED phone analyser for available P: < 5 % relative error. | [PMC10490029](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10490029/); [Talanta 2015](https://pubmed.ncbi.nlm.nih.gov/25703004/) | B |
| L-31 | A low-cost NPK field kit (Griess nitrate, molybdenum P, tetraphenylborate turbidity K): **r = 0.87 / 0.98 / 0.99** vs lab — but **category agreement only 61 / 83 / 81 %** when read **by eye**; USD 2.32/test. The authors attribute most errors to visual reading — the gap a camera reader closes. | [Commun. Soil Sci. Plant Anal. 2026](https://www.tandfonline.com/doi/full/10.1080/00103624.2026.2631600) | C |
| L-32 | **ICAR-IISS Mridaparikshak** mini-lab (colorimetry for all but pH/EC/N): **90–98 % agreement** with standard lab methods by parameter and soil type; units ₹50,000–1,00,000; refills ₹11,000 per 100 tests; ~₹160 per card. Uses STCR equations for advice. | [Business Standard](https://www.business-standard.com/article/news-cm/icar-indian-institute-of-soil-science-bhopal-develops-mridaparikshak-a-minilab-for-soil-testing-115021801194_1.html); [ICAR presentation](https://slidetodoc.com/presentation-on-mini-lab-mridaparikshak-developed-by-icarindian/) | B |
| L-33 | **Ion-selective electrodes**: handheld screen-printed K⁺ ISEs (±3.24 mV/decade reproducibility, MIT 2018); 3D-printed K⁺/pH ISEs on a PSoC4 (49.5 mV/dec K, −61 mV/pH); recurring problems: **drift, short lifetime, Ca²⁺ interference**. | [PLoS ONE 2018](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0203862); [2023 system](https://www.sciencedirect.com/science/article/pii/S2590123023006916); [printed nitrate](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9185318/) | B |

**Implication.** Ranked by evidence-per-rupee for a phone-attached instrument:
(1) **chemistry + phone camera in a light-controlled cradle** — proven by ICAR's
own colorimetric mini-lab at 90 %+ agreement, with the ₹50k reader replaced by
the phone; (2) **ISEs** for pH and K⁺ — feasible, but drift and calibration
burden are real; (3) **MEMS NIR** — good for OC and total N but costly, and
calibration doesn't transfer; (4) **RS485 NPK probes** — useful as EC/salinity
trend meters only, never for nutrient values. See HW-SAWA-001.

---

## 6. Crop disease and deficiency from leaf photos

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-34 | PlantVillage-trained CNNs score ~99 % on PlantVillage but **collapse on field photos**: MobileNetV2 99.77 % → **28.57 %**; Mohanty et al. noted ~31 % under different settings; PlantVillage has exploitable **background bias**. | [TinyCNN arXiv 2026](https://arxiv.org/html/2609.20290v1); [Frontiers 2016](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2016.01419/full) | B |
| L-35 | Training on mixed lab + field data (PlantDoc) and domain adaptation reach **~68–82 %** on field images — better, gap not closed. | [PMC12213485](https://pmc.ncbi.nlm.nih.gov/articles/PMC12213485/); [ScienceDirect 2024](https://www.sciencedirect.com/science/article/pii/S0168169924009657) | B |
| L-36 | Deployed: PlantVillage **Nuru** (cassava, offline) — **65 %** field accuracy, above extension agents (40–58 %) and farmers (18–31 %). | [Frontiers 2020](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2020.590889/full) | C |
| L-37 | **PlantDoc** (Singh et al., CoDS-COMAD 2020): in-field images, **CC-BY-4.0**. | [GitHub](https://github.com/pratikkayal/PlantDoc-Dataset) | A |

**Implication.** Crop health is feasible as a later module only with field
data, abstention ("I'm not sure") as a first-class output, and honest
field-accuracy reporting (ADR-016). It is also a crowded space (Plantix et al.);
SAWA's defensible core is soil.

---

## 7. Platform facts that constrain the design

| ID | Finding | Source | Conf. |
|---|---|---|---|
| L-38 | India: **Android ≈ 92–94 %** of smartphones (IMARC 2025 sales 92.4 %; StatCounter Sept 2026 93.89 %). | [StatCounter](https://gs.statcounter.com/os-market-share/mobile/india); [IMARC](https://www.imarcgroup.com/india-smartphone-market) | B |
| L-39 | **85.5 %** of households own ≥ 1 smartphone (NSO CMS:T, Jan–Mar 2025); **95.5 %** of rural 15–29-year-olds; large rural gender gap (51.6 % of rural women 15+ own no phone). | [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2132330&reg=48&lang=2); [Business Standard](https://www.business-standard.com/india-news/digital-india-divide-nso-rural-women-mobile-phone-ownership-gap-125052901804_1.html) | B |
| L-40 | **WebUSB** works in Chrome on Android (since 2017) over USB-OTG; **Web Serial** reached Android Chrome only in 2026 (Chrome 148). **No iOS browser** supports either; **DriverKit is iPad-only**; iPhone USB accessories need MFi/iAP2. | [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/features/webusb/); [Apple DTS](https://developer.apple.com/forums/thread/775578) | B |

**Implication.** A USB-C dongle can be driven *straight from the SAWA web app*
on ~93 % of Indian phones, with no app store. iPhones (including the
developer's own iPhone 14, which is Lightning anyway) need BLE through a native
wrapper — or, better, a camera-only first device that works on any phone
(ADR-015).

---

## 8. Open-source landscape (searched 11 Oct 2026)

| Project | What it is | Licence | Use in SAWA |
|---|---|---|---|
| [`google-research-datasets/india-soil-health-card`](https://github.com/google-research-datasets/india-soil-health-card) | SHC scraper (GCP: Spanner, GKE) + reliability analysis scripts + `card.proto` schema | Apache-2.0 | Schema alignment, cite reliability method; do not vendor the GCP stack |
| [`privet-kitty/munsell.js`](https://github.com/privet-kitty/munsell.js) | RGB ↔ Munsell conversion | MPL-2.0 | **Adopt as npm dependency** — Munsell is how soil scientists record colour |
| [`pratikkayal/PlantDoc-Dataset`](https://github.com/pratikkayal/PlantDoc-Dataset) | Field plant-disease images | CC-BY-4.0 | Future crop-health training data, with attribution |
| [`franckalbinet/soilspecdata`](https://github.com/franckalbinet/soilspecdata), [OSSL manual](https://github.com/soilspectroscopy/ossl-manual) | Open Soil Spectral Library tooling | Apache-2.0 / — | Only if the NIR path is ever pursued |
| [`aryan-vaghasiya/mitti-scan`](https://github.com/aryan-vaghasiya/mitti-scan) | SHC OCR via Google Cloud Vision + hard-coded rules | MIT | Reference for SHC import UX; needs a paid API key — prefer on-device OCR |
| [`Rachel-joy07/soilwise`](https://github.com/Rachel-joy07/soilwise) | Offline SHC advisory PWA | README says MIT, **no licence file** | Reference only; cite its *primary* sources, not the repo |
| [`GOURGOPAL618/THE_MRIDANSH`](https://github.com/GOURGOPAL618/THE_MRIDANSH), [`singhrdeep/AgriGrow-Sense`](https://github.com/singhrdeep/AgriGrow-Sense) | Similar soil platforms / DIY scanner | none / custom | Reference only — no licence grants reuse |
| [`rbaron/b-parasite`](https://github.com/rbaron/b-parasite) | Open BLE capacitive moisture sensor (2.4k★) | no licence file detected | Design reference for BLE moisture node |
| [`roboslog/Agriot_sense`](https://github.com/roboslog/Agriot_sense) | NPK IoT | "MIT" but README says non-commercial | Avoid — contradictory terms |

No repository found does what SAWA v3 proposes end to end (phone-as-instrument
+ SHC-unit advice + STCR + open validation). Several do one piece. **Confidence
B** — searches were broad but GitHub search is not exhaustive.

---

## 9. What this review does not establish

- No study here was run on Gorakhpur soils with SAWA's capture protocol. Every
  accuracy figure is someone else's, on their soils, phones and lighting.
  SAWA's own numbers come only from VAL-SAWA-001 studies.
- Reagent costs, BOM prices and regulatory requirements in HW/BIZ documents
  are partly inference (confidence C–D) and must be re-quoted before spending
  money.
- SHC portal terms of use for automated access were not reviewed. Treat bulk
  scraping as **legally unverified** until checked (DATA-SAWA-001 §4).
