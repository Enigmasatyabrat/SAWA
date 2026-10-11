# HW-SAWA-001
# Hardware Specification — a cheap, phone-attached soil test instrument

---

## Document Control

| Field | Value |
|---|---|
| Document ID | HW-SAWA-001 |
| Version | 1.0.0 |
| Status | Design proposal — nothing built; no part ordered |
| Created | 11 October 2026 |
| Depends on | LIT-SAWA-001 §5 & §7, ADR-015, VAL-SAWA-001 SV-005 |
| Price confidence | Component prices are **C–D** (catalogue memory and listings, not quotes). Re-quote before ordering. |

---

## 1. The brief, restated precisely

> "An IoT physical instrument to measure soil contents via sensors … attached to
> the phone via Type-C, just like those blood testing instruments … make it
> cheap … check how well it works."

The glucometer analogy is the right one, and it is worth being exact about why.
A glucometer is **not** a sensor that touches blood and "knows" sugar: it is a
cheap reader plus a **disposable chemical strip** in which an enzyme reaction
turns glucose into a signal the reader can measure. The cost sits in the
consumable; the reader is nearly free.

Soil nutrient testing works the same way when it works at all. Every method
with lab-level agreement found in LIT-SAWA-001 either uses a spectrometer
(₹1 lakh+, L-29) or **turns the nutrient into a colour with a reagent, then
reads the colour** (L-30 – L-32). ICAR's own Mridaparikshak does exactly this at
90–98 % lab agreement — with a ₹50,000–1,00,000 reader. **SAWA's hardware thesis
is: keep the proven chemistry, replace the expensive reader with the phone.**

---

## 2. What each sensing principle can actually deliver

| Principle | Measures | Evidence of accuracy | Unit cost | Verdict |
|---|---|---|---|---|
| Phone photo of bare soil | Colour, Munsell, OC class, moisture class | R² 0.58–0.88 for OC with calibration (L-01 – L-07) | ₹0 | **Software feature, not hardware** |
| RS485 "7-in-1 NPK" probe | Conductivity, re-labelled as N/P/K | Poor lab agreement unless locally calibrated (L-26) | ~₹7,000 | **Rejected for nutrients.** EC/moisture trend only |
| Capacitive moisture + temp | Volumetric moisture trend | Well characterised; needs per-soil calibration | ₹100–500 | Optional field node (§7) |
| Reagent + **eye** vs colour chart | N, P, K classes | r 0.87/0.98/0.99 but class agreement 61/83/81 % (L-31) | kit ₹800–6,000 | Baseline to beat |
| Reagent + **phone camera** in a light box | Nitrate, phosphate, (turbidity K) | ≤ 1 % bias, ~2 % RSD (L-30) | ₹300–800 cradle | **HW-0** |
| Reagent + **LED / photodiode** colorimeter | Same, better SNR at the right wavelength | Mridaparikshak 90–98 % lab agreement (L-32) | ₹1,500–3,000 dongle | **HW-1** |
| Ion-selective electrodes | pH (mature), K⁺, NO₃⁻ (drift-prone) | Nernstian, but drift and short life (L-33) | pH probe ₹500–1,500 | pH in **HW-1**; K⁺/NO₃⁻ R&D |
| AS7265x 18-channel Vis/NIR | Leaf/liquid reflectance | Little soil evidence; misses 1400–2500 nm (L-28) | ~$65 | **Rejected for soil** |
| MEMS FT-NIR (NeoSpectra-class) | OC, total N, CEC | R² 0.75–0.89 for OC/TN; calibration doesn't transfer (L-27) | ₹1 lakh+ (Bhu-Parikshak ₹1.17 lakh, L-29) | **Deferred** (§8) |

---

## 3. HW-0 — "SAWA Lens": camera-read colorimetry, zero electronics

### 3.1 What it is
A 3D-printed, light-tight cradle that clips over the phone's rear camera, with
a **three-slot cuvette holder** and a diffuse light path. The user prepares a
soil extract with a reagent kit; the app photographs three cuvettes in one
frame:

| Slot | Contents | Why |
|---|---|---|
| 1 — Blank | Reagent + extractant, no soil | Zero reference |
| 2 — Standard | Reagent + a known-concentration standard | Calibration point in the *same* photo |
| 3 — Sample | Reagent + soil extract | The unknown |

**This same-frame, ratiometric design is the key engineering decision.** Phone
cameras differ in colour processing (L-05) and phone flashes differ in
spectrum. Reading the sample *relative to a blank and a standard captured in
the same image, under the same light* cancels most of that variation — the
same principle a lab spectrophotometer relies on. Concentration comes from the
standard curve (Beer–Lambert, applied to the channel matching each reagent's
colour), not from absolute RGB.

Confidence: principle **B** (standard analytical practice, used by L-30);
achievable accuracy on SAWA's own build **D** until SV-005 runs.

### 3.2 Chemistry (choose SHC-compatible methods so results land in card units)

| Parameter | Extraction (matches SHC method, L-16) | Colour reaction | Read channel |
|---|---|---|---|
| Nitrate-N | KCl or water extract | Zinc reduction → **Griess** azo dye (pink, λ≈540 nm). *No cadmium* — toxic. | Green |
| Available P | **Olsen** 0.5 M NaHCO₃, pH 8.5 (most UP alluvial soils are neutral–alkaline) | **Molybdenum blue** (ascorbic acid reductant), λ≈880 nm | Red / NIR |
| Available K | Neutral normal **NH₄OAc** | **Tetraphenylborate** turbidity (white precipitate) | Any — scattering |
| pH | 1 : 2.5 soil : water | Indicator dye (HW-0) or electrode (HW-1) | Hue / mV |
| EC | 1 : 2 soil : water | — | HW-1 only (conductivity cell) |

Note: SHC "available N" uses alkaline KMnO₄ (Subbiah & Asija), which measures a
mineralisable pool, not nitrate. A nitrate reading is **not** the same quantity
and must not be displayed as the card's N value. Mapping nitrate → SHC N class
is a calibration problem for SV-005, not an assumption. Confidence **B**.

### 3.3 Bill of materials (indicative)

| Item | Indicative cost (₹) | Conf. |
|---|---|---|
| 3D-printed cradle, PLA, ~40 g | 80–200 | C |
| Diffuser film + matte black interior paint | 30–80 | C |
| Optional: coin-cell white LED + switch (fixes light-source variation) | 30–80 | C |
| 3 × 10 mm polystyrene cuvettes (reusable) | 30–60 | C |
| Neutral grey card patch (exposure reference) | 20–50 | C |
| **Cradle total** | **≈ 200–500** | C |
| Pocket scale 0.01 g (weighing beats scoops for extraction ratios) | 400–700 | C |
| Shaking vials, syringe filters, droppers | 100–300 per 25 tests | D |
| Reagent panel per test (N, P, K, pH) | **target ≤ 100** — published kit cost USD 2.32/test (L-31); Mridaparikshak refill ≈ ₹110/test (L-32) | D |

### 3.4 Why HW-0 first
- Works on **any** phone, including iPhone (no USB, no BLE) — the developer can
  test it on their own iPhone 14 today.
- Cost to prototype is a few hundred rupees plus reagents.
- It directly tests the riskiest assumption — *can a phone camera read these
  reactions as well as a reader?* — before any PCB is designed.

---

## 4. HW-1 — "SAWA Probe": USB-C / BLE colorimeter dongle

### 4.1 Block diagram

```
 ┌────────────────────────── SAWA Probe (USB-C) ──────────────────────────┐
 │  LED driver ──► 525 nm LED ─┐                                          │
 │  LED driver ──► 880 nm LED ─┼──► [ cuvette ] ──► photodiode ─► TIA ─┐   │
 │  LED driver ──► 630 nm LED ─┘                                     │   │
 │                                                                   ▼   │
 │  pH electrode (BNC) ──► electrometer op-amp buffer ──────────► 16-bit ADC
 │  4-electrode EC cell ──► AC excitation + sense ──────────────►  (ADS1115-class)
 │  NTC thermistor (temperature compensation) ──────────────────►     │   │
 │                                                                    ▼   │
 │          MCU with native USB + BLE (ESP32-S3-class) ◄──────────────┘   │
 │             │ USB CDC / WebUSB            │ BLE GATT                   │
 └─────────────┼─────────────────────────────┼────────────────────────────┘
               ▼                             ▼
   Android Chrome: SAWA PWA         iOS: SAWA in native wrapper
   via WebUSB (no app store)        (Capacitor BLE plugin)
```

### 4.2 Design choices and reasons

| Choice | Reason | Conf. |
|---|---|---|
| **Discrete LED + photodiode per assay wavelength** (525 / 630 / 880 nm) rather than a camera | Narrowband light at each reagent's absorption peak gives better signal-to-noise than broadband RGB; this is how dedicated colorimeters (incl. Mridaparikshak-class) work | B |
| Alternative: an 11-channel spectral sensor (AS7341-class) | Fewer optical parts, covers 415–680 nm + NIR, but broader channels; evaluate both in SV-005 | C |
| **ESP32-S3-class MCU** | Native USB device mode **and** BLE in one chip — USB for Android via WebUSB (L-40), BLE for iOS | B |
| External 16-bit ADC | Microcontroller ADCs are too noisy for small absorbance changes and mV-level electrode signals | B |
| **Electrometer-grade op-amp** on the pH input | Glass electrodes have ~10⁸–10⁹ Ω impedance; an ordinary op-amp's input bias current corrupts the reading | B |
| Temperature sensor | Both Nernstian slopes and conductivity are temperature-dependent | A (textbook) |
| USB bus power, no battery in v1 | Simpler, cheaper, no charging circuit; the phone powers it via OTG | C |

### 4.3 Indicative BOM (HW-1)

| Block | Indicative cost (₹) | Conf. |
|---|---|---|
| ESP32-S3 module | 300–500 | C |
| ADC, op-amps, LED drivers, passives, USB-C connector | 300–600 | D |
| LEDs + photodiodes + 3D-printed optical block | 150–300 | D |
| PCB (2-layer, small batch) + assembly | 200–500 | D |
| pH combination electrode | 500–1,500 | C |
| Enclosure | 100–300 | D |
| **Total, small batch** | **≈ 1,500–3,700** | D |

Compare: Bhu-Parikshak ₹1,17,410 (L-29); Mridaparikshak ₹50,000–1,00,000 (L-32).
Even at the top of the range, HW-1 is roughly **30–60× cheaper** — the phone
supplies the screen, compute, connectivity and storage. Confidence in the
order of magnitude **C**; in exact figures **D**.

### 4.4 Software interface
- Firmware exposes one tiny protocol over both transports:
  `INFO`, `CAL <assay>`, `READ <assay>` → `{assay, raw_counts[], temperature_c, timestamp}`.
- **All chemistry maths lives in the app**, not the firmware, so curves and
  corrections can be updated without reflashing.
- Every reading is stored as a measurement with
  `source = "sawa-probe"`, `method`, `device_id`, firmware version and the
  calibration it used (SYS-SAWA-001 §3).

---

## 5. Calibration — where accuracy is actually won

1. **Per run:** blank + one standard per assay (HW-0 does this in-frame; HW-1
   as a two-step read).
2. **Per batch of reagent:** a 4–5-point standard curve, stored with the batch ID.
3. **Per soil region:** paired lab comparison (SV-005) to map kit readings onto
   SHC method values, especially nitrate → SHC-N class (§3.2 note).
4. **Per device:** LED intensity drift check against a sealed reference cuvette.

---

## 6. Safety and regulation (low confidence — get advice before selling)

| Topic | Note | Conf. |
|---|---|---|
| Reagents | Griess components, molybdate in acid, tetraphenylborate: irritants/corrosives. Need MSDS, child-resistant packaging, disposal guidance in Hindi. | C |
| Selling reagent kits | Packaging and labelling rules for packaged commodities likely apply; chemical classifications to be checked. | D |
| Electronics | 5 V USB-powered, no mains — low electrical risk; check whether any compulsory registration applies to this product category. | D |
| Claims | No "lab-equivalent" claim until SV-005 passes (ADR-020). | A (policy) |

---

## 7. Optional field node (separate, later)

A buried BLE moisture/temperature/EC node in the spirit of
[`b-parasite`](https://github.com/rbaron/b-parasite) (design reference only — no
licence file) for continuous monitoring. Useful for irrigation advice, not for
nutrients. Out of scope until the core instrument is validated.

---

## 8. What is deliberately not proposed

- **NIR spectrometer** — strongest for OC/total N, but ₹1 lakh+ and calibration
  doesn't transfer between units (L-27). Revisit if a B2B lab customer will pay.
- **Paper microfluidic strips (μPADs)** — the closest thing to a true glucometer
  strip; published for phosphate with phone readout
  ([PMC12788290](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12788290/)). A
  promising v2 consumable once HW-0's chemistry is proven. R&D, not v1.
- **Selling RS485 NPK probes with an app** — the most common "IoT soil NPK"
  project on GitHub and the least defensible scientifically (L-26).

---

## 9. Build sequence and decision gates

| Step | Output | Gate to proceed |
|---|---|---|
| H0.1 | Print cradle; photograph dilution series of a coloured standard on 2 phones | Same-frame ratio is linear (R² ≥ 0.99) across the series |
| H0.2 | Griess nitrate + molybdenum-blue P on 10 lab-tested soils | Class agreement > visual baseline (L-31) |
| H0.3 | 30–50 soils incl. K turbidity and pH (SV-005) | Meets SV-005 acceptance |
| H1.1 | Breadboard LED/photodiode + ADC; same 30–50 soils | Better precision than H0.3 |
| H1.2 | PCB v1, WebUSB from the PWA on an Android phone | End-to-end reading stored with provenance |
| H1.3 | BLE path in native wrapper on iPhone | Same readings as USB within tolerance |

Funding fit: NIDHI-PRAYAS prototype grants (up to ₹10 lakh, individuals
eligible) align with H0–H1 (BIZ-SAWA-001 §7).
