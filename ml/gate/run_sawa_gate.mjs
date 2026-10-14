// Runs SAWA's shipped validation gate (src/lib/image-validation.ts) unchanged
// over a batch of pre-resized pixel grids, so the trained gate can be compared
// against the real thing rather than a re-implementation.
//
// Usage: node ml/gate/run_sawa_gate.mjs <grids.bin> <meta.json> <out.json>
//   grids.bin : N x 150 x 150 x 3 uint8, row-major RGB (same 150x150 grid the app samples)
//   meta.json : [{ "id": ..., "w": naturalWidth, "h": naturalHeight }, ...]
import { readFileSync, writeFileSync } from "node:fs";
import { computeValidationMetrics, evaluateValidation } from "../../src/lib/image-validation.ts";

const [, , binPath, metaPath, outPath] = process.argv;
const GRID = 150;
const buf = readFileSync(binPath);
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
const per = GRID * GRID * 3;
if (buf.length !== per * meta.length) throw new Error(`size mismatch: ${buf.length} vs ${per * meta.length}`);

const out = meta.map((m, i) => {
  const base = i * per;
  const pixels = new Array(GRID * GRID);
  for (let p = 0; p < GRID * GRID; p++) {
    const o = base + p * 3;
    pixels[p] = [buf[o], buf[o + 1], buf[o + 2]];
  }
  const report = evaluateValidation(computeValidationMetrics(pixels, GRID, m.w, m.h));
  return { id: m.id, verdict: report.verdict, confidence: report.confidence, band: report.band,
           reason: report.primaryReason, metrics: report.metrics };
});
writeFileSync(outPath, JSON.stringify(out));
console.log(`gate run on ${out.length} images`);
