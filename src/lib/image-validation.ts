/**
 * image-validation.ts
 *
 * Client-side approximation of Steps 1-2 of VALIDATION_SYSTEM_PROMPT.md
 * ("Validate the image" / "Confidence check") for a static, backend-free
 * site: no server, no ML runtime, nothing but the pixels already sampled
 * for K-Means. Everything here is plain colour/luminance/gradient
 * statistics — genuinely computed from the uploaded image, never a
 * fabricated or hard-coded number.
 *
 * Honest scope note (see VALIDATION_SYSTEM_PROMPT.md #6 for the full
 * version): colour and local-contrast statistics can defensibly flag
 * "mostly sky-blue", "mostly green/vegetation", "too dark/bright/flat to
 * read", or "too small to sample". They CANNOT reliably recognise specific
 * objects — a person, a building, a car — the way a trained vision model
 * could. Where the spec asks to reject people/animals/vehicles/buildings
 * by name, this module instead falls back to the same signal it always
 * has: does the frame look predominantly soil-coloured, with plausible
 * surface texture, at usable resolution and exposure? If not, it abstains
 * (rejects or flags Uncertain) rather than guessing at a category it has
 * no real evidence for.
 */

import type { RGB } from "./soil-engine";

// ---------------------------------------------------------------------------
// Thresholds — every number below is referenced from a check's evidence
// string, so a reviewer can see exactly which measurement drove a verdict.
// ---------------------------------------------------------------------------

const THRESH = {
  // resolution (natural pixel dimensions, shorter side)
  HARD_MIN_SIDE: 32, // below this a photo is essentially unusable/corrupt
  RES_FULL_MARKS_SIDE: 256, // resolution score reaches 1.0 at/above this

  // exposure (mean luminance, 0-1)
  DARK_HARD: 0.06,
  DARK_SOFT: 0.14,
  BRIGHT_SOFT: 0.88,
  BRIGHT_HARD: 0.95,
  NEAR_BLACK_FRACTION_HARD: 0.75,
  NEAR_WHITE_FRACTION_HARD: 0.75,

  // subject-matter (hue/sat/val fractions, 0-1)
  VEGETATION_FRACTION_HARD: 0.55,
  SKY_WATER_FRACTION_HARD: 0.55,

  // texture / detail (mean local luminance-gradient magnitude)
  TEXTURE_FLOOR: 0.012,
  TEXTURE_FULL_MARKS: 0.05,

  // confidence gates
  CONFIDENCE_PROCEED: 70,
  CONFIDENCE_HIGH: 90,
} as const;

const WEIGHTS = {
  soilColor: 0.42,
  exposure: 0.18,
  texture: 0.22,
  resolution: 0.18,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationVerdict = "rejected" | "uncertain" | "ok";
export type ConfidenceBand = "high" | "medium" | "low";
export type CheckStatus = "pass" | "warn" | "fail";

export type ValidationCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

export type ValidationMetrics = {
  gridSize: number;
  sampledPixels: number;
  naturalWidth: number;
  naturalHeight: number;
  minSide: number;
  meanLuminance: number;
  fractionNearBlack: number;
  fractionNearWhite: number;
  textureScore: number;
  rgbStdDev: number;
  avgRGB: RGB;
  avgHue: number;
  avgSat: number;
  avgVal: number;
  soilHueFraction: number;
  vegetationFraction: number;
  skyWaterFraction: number;
};

export type ValidationReport = {
  verdict: ValidationVerdict;
  confidence: number; // 0-100, always computed — even a rejection shows its number
  band: ConfidenceBand;
  primaryReason: string | null; // populated for "rejected" | "uncertain"
  recommendation: string | null;
  checks: ValidationCheck[];
  metrics: ValidationMetrics;
};

// ---------------------------------------------------------------------------
// Small numeric helpers
// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return [h, s, v];
}

// ---------------------------------------------------------------------------
// Step 0: measure. Pure function — same pixel grid K-Means already sampled,
// no DOM, no randomness, fully unit-testable.
// ---------------------------------------------------------------------------

export function computeValidationMetrics(
  pixels: RGB[],
  gridSize: number,
  naturalWidth: number,
  naturalHeight: number
): ValidationMetrics {
  const n = pixels.length || 1;
  const lum = new Float32Array(pixels.length);

  let sumR = 0,
    sumG = 0,
    sumB = 0,
    sumLum = 0;
  let nearBlack = 0,
    nearWhite = 0;
  let soilCount = 0,
    vegCount = 0,
    skyCount = 0;

  for (let i = 0; i < pixels.length; i++) {
    const [r, g, b] = pixels[i];
    sumR += r;
    sumG += g;
    sumB += b;

    const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    lum[i] = l;
    sumLum += l;

    const [h, s, v] = rgbToHsv(r, g, b);
    if (v < 0.06) nearBlack++;
    if (v > 0.94 && s < 0.12) nearWhite++;

    const isVeg = h >= 70 && h <= 170 && s >= 0.18 && v >= 0.12;
    const isSky = h >= 175 && h <= 260 && v >= 0.3;
    const isWarmSoil = (h <= 50 || h >= 335) && s >= 0.1 && v >= 0.08 && v <= 0.92;
    const isNeutralSoil = s < 0.15 && v >= 0.12 && v <= 0.82;

    if (isVeg) vegCount++;
    else if (isSky) skyCount++;
    else if (isWarmSoil || isNeutralSoil) soilCount++;
  }

  // Local detail/texture: mean gradient magnitude of the luminance grid
  // (a simple centred-difference proxy for a Sobel operator). Real soil
  // close-ups carry grain from particles and moisture; a flat wall, a
  // blown highlight, or heavy blur does not.
  let gradSum = 0,
    gradCount = 0;
  for (let row = 1; row < gridSize - 1; row++) {
    for (let col = 1; col < gridSize - 1; col++) {
      const idx = row * gridSize + col;
      if (idx + 1 >= lum.length || idx - 1 < 0 || idx + gridSize >= lum.length || idx - gridSize < 0) continue;
      const dx = lum[idx + 1] - lum[idx - 1];
      const dy = lum[idx + gridSize] - lum[idx - gridSize];
      gradSum += Math.sqrt(dx * dx + dy * dy);
      gradCount++;
    }
  }
  const textureScore = gradCount > 0 ? gradSum / gradCount : 0;

  const avgRGB: RGB = [sumR / n, sumG / n, sumB / n];
  const [avgHue, avgSat, avgVal] = rgbToHsv(avgRGB[0], avgRGB[1], avgRGB[2]);

  let varSum = 0;
  for (let i = 0; i < pixels.length; i++) {
    const [r, g, b] = pixels[i];
    varSum += (r - avgRGB[0]) ** 2 + (g - avgRGB[1]) ** 2 + (b - avgRGB[2]) ** 2;
  }
  const rgbStdDev = Math.sqrt(varSum / (3 * n));

  return {
    gridSize,
    sampledPixels: pixels.length,
    naturalWidth,
    naturalHeight,
    minSide: Math.min(naturalWidth, naturalHeight),
    meanLuminance: sumLum / n,
    fractionNearBlack: nearBlack / n,
    fractionNearWhite: nearWhite / n,
    textureScore,
    rgbStdDev,
    avgRGB,
    avgHue,
    avgSat,
    avgVal,
    soilHueFraction: soilCount / n,
    vegetationFraction: vegCount / n,
    skyWaterFraction: skyCount / n,
  };
}

/** Convenience wrapper for the one call site that has an HTMLImageElement. */
export function metricsFromImage(img: HTMLImageElement, pixels: RGB[], gridSize: number): ValidationMetrics {
  return computeValidationMetrics(pixels, gridSize, img.naturalWidth || gridSize, img.naturalHeight || gridSize);
}

// ---------------------------------------------------------------------------
// Step 1: hard rejects — reserved for overwhelming, unambiguous signal.
// Anything short of "clearly, dominantly wrong" falls through to the
// confidence gate in Step 2 instead of being force-rejected.
// ---------------------------------------------------------------------------

function hardRejectReason(m: ValidationMetrics): string | null {
  if (m.minSide < THRESH.HARD_MIN_SIDE) {
    return `The source image is only ${m.naturalWidth}\u00d7${m.naturalHeight}px \u2014 too small to sample reliably.`;
  }
  if (m.fractionNearBlack >= THRESH.NEAR_BLACK_FRACTION_HARD) {
    return `${pct(m.fractionNearBlack)} of the frame is near-black \u2014 this looks like a failed capture or extreme underexposure, not a readable surface.`;
  }
  if (m.fractionNearWhite >= THRESH.NEAR_WHITE_FRACTION_HARD) {
    return `${pct(m.fractionNearWhite)} of the frame is blown-out white \u2014 this looks like overexposure or a blank frame, not a readable surface.`;
  }
  if (m.vegetationFraction >= THRESH.VEGETATION_FRACTION_HARD) {
    return `${pct(m.vegetationFraction)} of sampled pixels read as green, plant-like colour \u2014 this looks like foliage or grass, not soil.`;
  }
  if (m.skyWaterFraction >= THRESH.SKY_WATER_FRACTION_HARD) {
    return `${pct(m.skyWaterFraction)} of sampled pixels read as blue tones \u2014 this looks like sky or water, not soil.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 2: confidence — every sub-score is a plain 0-1 function of a metric
// above, then combined with fixed, documented weights. No sub-score can
// exceed its own evidence: e.g. a perfect soil-colour reading from a
// 30x30px thumbnail still gets capped by a low resolution score.
// ---------------------------------------------------------------------------

function scoreResolution(minSide: number): number {
  return clamp01((minSide - THRESH.HARD_MIN_SIDE) / (THRESH.RES_FULL_MARKS_SIDE - THRESH.HARD_MIN_SIDE));
}

function scoreExposure(meanLum: number): number {
  if (meanLum <= THRESH.DARK_HARD || meanLum >= THRESH.BRIGHT_HARD) return 0;
  if (meanLum < THRESH.DARK_SOFT) return (meanLum - THRESH.DARK_HARD) / (THRESH.DARK_SOFT - THRESH.DARK_HARD);
  if (meanLum > THRESH.BRIGHT_SOFT) return (THRESH.BRIGHT_HARD - meanLum) / (THRESH.BRIGHT_HARD - THRESH.BRIGHT_SOFT);
  return 1;
}

function scoreTexture(t: number): number {
  return clamp01((t - THRESH.TEXTURE_FLOOR) / (THRESH.TEXTURE_FULL_MARKS - THRESH.TEXTURE_FLOOR));
}

function computeConfidence(m: ValidationMetrics): number {
  const s =
    WEIGHTS.soilColor * clamp01(m.soilHueFraction) +
    WEIGHTS.exposure * scoreExposure(m.meanLuminance) +
    WEIGHTS.texture * scoreTexture(m.textureScore) +
    WEIGHTS.resolution * scoreResolution(m.minSide);
  return Math.round(clamp01(s) * 100);
}

// ---------------------------------------------------------------------------
// Evidence trail — always built, regardless of verdict, so a rejection or
// an "uncertain" result still shows exactly what was measured.
// ---------------------------------------------------------------------------

function buildChecks(m: ValidationMetrics): ValidationCheck[] {
  return [
    {
      id: "resolution",
      label: "Resolution",
      status: m.minSide < THRESH.HARD_MIN_SIDE ? "fail" : m.minSide < THRESH.RES_FULL_MARKS_SIDE ? "warn" : "pass",
      detail: `${m.naturalWidth}\u00d7${m.naturalHeight}px source \u2014 ${m.sampledPixels.toLocaleString()} pixels sampled for analysis.`,
    },
    {
      id: "exposure",
      label: "Exposure",
      status:
        m.meanLuminance <= THRESH.DARK_HARD || m.meanLuminance >= THRESH.BRIGHT_HARD
          ? "fail"
          : m.meanLuminance < THRESH.DARK_SOFT || m.meanLuminance > THRESH.BRIGHT_SOFT
            ? "warn"
            : "pass",
      detail: `Average brightness ${pct(m.meanLuminance)}${
        m.fractionNearBlack > 0.2 ? `, ${pct(m.fractionNearBlack)} of pixels near-black` : ""
      }${m.fractionNearWhite > 0.2 ? `, ${pct(m.fractionNearWhite)} of pixels blown out` : ""}.`,
    },
    {
      id: "texture",
      label: "Surface detail",
      status: m.textureScore < THRESH.TEXTURE_FLOOR ? "warn" : "pass",
      detail:
        m.textureScore < THRESH.TEXTURE_FLOOR
          ? "Very little local variation across the frame \u2014 may be out of focus, or unusually flat/smooth for a soil close-up."
          : "Local tonal variation detected, consistent with grain, moisture, or particle texture on a close-up surface.",
    },
    {
      id: "soil-colour",
      label: "Colour composition",
      status: m.soilHueFraction >= 0.5 ? "pass" : m.soilHueFraction >= 0.25 ? "warn" : "fail",
      detail: `${pct(m.soilHueFraction)} of sampled pixels fall in typical soil hue/saturation ranges (browns, tans, reds, greys). Average sampled colour: rgb(${Math.round(
        m.avgRGB[0]
      )}, ${Math.round(m.avgRGB[1])}, ${Math.round(m.avgRGB[2])}).`,
    },
    {
      id: "vegetation",
      label: "Vegetation signal",
      status: m.vegetationFraction >= THRESH.VEGETATION_FRACTION_HARD ? "fail" : m.vegetationFraction >= 0.25 ? "warn" : "pass",
      detail: `${pct(m.vegetationFraction)} of sampled pixels read as green, plant-like colour.`,
    },
    {
      id: "sky-water",
      label: "Sky / water signal",
      status: m.skyWaterFraction >= THRESH.SKY_WATER_FRACTION_HARD ? "fail" : m.skyWaterFraction >= 0.25 ? "warn" : "pass",
      detail: `${pct(m.skyWaterFraction)} of sampled pixels read as blue tones consistent with sky or water.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function evaluateValidation(metrics: ValidationMetrics): ValidationReport {
  const checks = buildChecks(metrics);
  const confidence = computeConfidence(metrics);
  const band: ConfidenceBand = confidence >= THRESH.CONFIDENCE_HIGH ? "high" : confidence >= THRESH.CONFIDENCE_PROCEED ? "medium" : "low";

  const reject = hardRejectReason(metrics);
  if (reject) {
    return {
      verdict: "rejected",
      confidence,
      band,
      primaryReason: reject,
      recommendation: "Please upload a clear, close-up photo where soil fills most of the frame, taken in even natural light.",
      checks,
      metrics,
    };
  }

  if (confidence < THRESH.CONFIDENCE_PROCEED) {
    return {
      verdict: "uncertain",
      confidence,
      band,
      primaryReason: "The visible evidence is insufficient for a reliable soil assessment.",
      recommendation: "Try moving closer so soil fills the frame, hold the camera steady, and shoot in even natural light.",
      checks,
      metrics,
    };
  }

  return {
    verdict: "ok",
    confidence,
    band,
    primaryReason: null,
    recommendation: null,
    checks,
    metrics,
  };
}

export const VALIDATION_THRESHOLDS = THRESH;
export const VALIDATION_WEIGHTS = WEIGHTS;
