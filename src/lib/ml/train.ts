/**
 * ML Model Training Pipeline
 * Phase 2: implement once real labelled soil data has been collected.
 *
 * This file will contain:
 * 1. Data loading from data/samples/manifest.csv
 * 2. Feature extraction (see ./features.ts)
 * 3. Model training (scikit-learn via Python, or TensorFlow.js in Node)
 * 4. Model evaluation and validation
 * 5. Model serialization (.pkl or .onnx)
 *
 * Phase 1 (current): scaffolding only.
 *
 * The message is exposed as a function rather than a top-level `console.log`
 * so that merely importing this module has no side effects.
 */

export const TRAINING_NOT_IMPLEMENTED =
  "⚠️  ML training not yet implemented. Waiting for Phase 1 data collection.";

/**
 * Entry point for the Phase 2 training run.
 *
 * @throws Always, until Phase 1 data collection is complete. Failing loudly is
 * deliberate: a silent no-op could be mistaken for a successful training run.
 */
export function trainModel(): never {
  throw new Error(TRAINING_NOT_IMPLEMENTED);
}
