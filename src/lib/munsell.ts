/**
 * munsell.ts
 * Munsell notation for soil colours — the vocabulary soil scientists use
 * ("10YR 4/3") instead of RGB.
 *
 * SERVER-ONLY by convention: the `munsell` package (MPL-2.0, used unmodified as
 * a dependency — ADR-SAWA-002 ADR-017) carries ~1.6 MB of renotation data.
 * Import this from route handlers, never from a client component, so that data
 * stays out of the browser bundle. The analyze-soil route returns the strings.
 *
 * The camera colour is uncalibrated: phone colour processing and lighting
 * shift it (LIT-SAWA-001 L-05, L-07). These notations describe the photo, not
 * a chart reading of the soil, until a reference card is in frame (SYS C-3).
 */

import { rgb255ToMhvc, rgb255ToMunsell } from "munsell";
import type { RGB } from "@/lib/soil-engine";

/** Munsell hue families in order of the library's 0–100 hue scale. */
const FAMILIES = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"] as const;

/** Hue pages in a standard Munsell Soil Color Book (gley pages not modelled). */
const SOIL_CHART_HUES = new Set(["10R", "2.5YR", "5YR", "7.5YR", "10YR", "2.5Y", "5Y"]);

/** Value and chroma steps printed on soil-chart pages. */
const SOIL_CHART_VALUES = [2, 2.5, 3, 4, 5, 6, 7, 8];
const SOIL_CHART_CHROMAS = [1, 2, 3, 4, 6, 8];

/** Below this chroma a colour reads as neutral grey ("N 5/"). */
const NEUTRAL_CHROMA = 0.5;

export type SoilMunsell = {
  /** Nearest soil-chart chip, e.g. "7.5YR 3/2" or "N 5/". */
  notation: string;
  /** Unrounded notation from the converter, e.g. "8YR 3.1/2.4". */
  precise: string;
  /** Whether the hue falls on a standard soil-chart page (10R–5Y). */
  onSoilChart: boolean;
};

function nearest(steps: readonly number[], v: number): number {
  return steps.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best));
}

/**
 * Hue on the library's 0–100 scale → page name, snapped to the 2.5 steps soil
 * charts use. On that scale 10R = 10, 2.5YR = 12.5 … 10YR = 20, 5Y = 25, so a
 * family owns the half-open interval (10k, 10k + 10].
 */
export function hueName(hue100: number): string {
  let h = Math.round(hue100 / 2.5) * 2.5;
  h = ((h % 100) + 100) % 100;
  if (h === 0) h = 100; // 0 and 100 are the same hue: 10RP
  const family = Math.ceil(h / 10) - 1;
  return `${h - family * 10}${FAMILIES[family]}`;
}

/** Munsell description of one colour, snapped to the nearest soil-chart chip. */
export function soilMunsell([r, g, b]: RGB): SoilMunsell {
  const [hue100, value, chroma] = rgb255ToMhvc(r, g, b);
  const v = nearest(SOIL_CHART_VALUES, value);
  const precise = rgb255ToMunsell(r, g, b);

  if (chroma < NEUTRAL_CHROMA) {
    return { notation: `N ${v}/`, precise, onSoilChart: true };
  }
  const hue = hueName(hue100);
  return {
    notation: `${hue} ${v}/${nearest(SOIL_CHART_CHROMAS, chroma)}`,
    precise,
    onSoilChart: SOIL_CHART_HUES.has(hue),
  };
}

/** Share-weighted mean of the cluster colours, i.e. the image's overall colour. */
export function weightedColor(colors: RGB[], percentages: number[]): RGB {
  const total = percentages.reduce((a, p) => a + p, 0) || 1;
  const sum: RGB = [0, 0, 0];
  colors.forEach((c, i) => {
    const w = (percentages[i] ?? 0) / total;
    sum[0] += c[0] * w;
    sum[1] += c[1] * w;
    sum[2] += c[2] * w;
  });
  return [Math.round(sum[0]), Math.round(sum[1]), Math.round(sum[2])];
}
