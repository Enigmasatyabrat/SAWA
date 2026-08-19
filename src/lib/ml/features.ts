/**
 * ML Feature Extraction for Phase 2 Model Training
 *
 * Phase 2 will train a real model on labelled soil data (see data/samples/).
 * This module extracts features from analysis output and raw image data.
 *
 * Phase 0-1: nutrient prediction uses the heuristic in `soil-engine.ts`.
 * Nothing in this file is wired into the running app yet.
 */

import type { RGB } from "@/lib/soil-engine";

/** Number of features `extractColorFeatures` emits per colour cluster. */
export const FEATURES_PER_CLUSTER = 6;

/**
 * Extract colour features from dominant colours.
 *
 * Input: K-Means dominant colours + percentages (already computed by the
 * pipeline, so this is cheap and reuses work the API has done).
 * Output: a flat feature vector for model training.
 *
 * Feature order per cluster: r, g, b, share, brightness, colour spread.
 * With the pipeline's default k=5 that yields a 30-element vector.
 */
export function extractColorFeatures(dominantColors: RGB[], percentages: number[]): number[] {
  const features: number[] = [];

  for (let i = 0; i < dominantColors.length; i++) {
    const [r, g, b] = dominantColors[i];
    features.push(
      r,
      g,
      b,
      // Percentages are index-aligned with the colours; default to 0 if a
      // caller passes a short array rather than silently emitting undefined.
      percentages[i] ?? 0,
      r + g + b, // brightness
      Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r) // colour spread
    );
  }

  return features;
}

/**
 * Extract texture statistics from an image buffer.
 * Will be implemented in Phase 2 once a real dataset exists.
 *
 * Intended features: contrast, local variance, edge density, entropy.
 * Note `image-validation.ts` already computes related texture statistics
 * client-side; that logic is the obvious starting point.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- placeholder signature for Phase 2
export function extractTextureFeatures(imageBuffer: Buffer): number[] {
  // TODO: Phase 2 implementation.
  return [];
}

/**
 * Combine all features into a single vector.
 * Used by the Phase 2 training pipeline.
 */
export function combineFeatures(colorFeatures: number[], textureFeatures: number[]): number[] {
  return [...colorFeatures, ...textureFeatures];
}
