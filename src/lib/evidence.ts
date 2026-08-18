/**
 * evidence.ts
 *
 * Adds transparency on top of soil-engine.ts WITHOUT changing it. The
 * classifier in soil-engine.ts is a faithful port of backend/server.py and
 * stays byte-for-byte as-is (see BUILD_LOG.md #1) — this module only
 * re-examines its inputs and output to answer "how confidently did that
 * match, and what's the evidence?"
 *
 * The confidence number below is derived, not invented: it is a direct
 * function of how far the average sampled colour sits from the nearest
 * rule boundary in classifySoilType's own if/elif thresholds. A colour
 * deep inside a class's RGB range scores high; a colour one unit from
 * flipping to a different class scores low. That is the same idea as
 * Step 3's worked example in VALIDATION_SYSTEM_PROMPT.md, just computed
 * from the real threshold logic instead of asserted.
 */

import { avgColor, type RGB, type SoilType } from "./soil-engine";

export type EvidenceBand = "high" | "medium" | "low";

export type ClassificationEvidence = {
  confidence: number; // 0-100
  band: EvidenceBand;
  evidence: string[];
};

const MARGIN_SCALE = 30; // RGB units of margin that counts as "fully confident"
const CONF_FLOOR = 55; // a rule that technically matched is never reported below this
const CONF_CEIL = 96; // never claim near-certainty from a colour-threshold rule alone

function marginToConfidence(margin: number): number {
  const t = Math.max(0, Math.min(1, margin / MARGIN_SCALE));
  return CONF_FLOOR + t * (CONF_CEIL - CONF_FLOOR);
}

export function explainSoilType(colors: RGB[], percentages: number[], soilType: SoilType): ClassificationEvidence {
  const [rf, gf, bf] = avgColor(colors);
  const r = Math.round(rf),
    g = Math.round(gf),
    b = Math.round(bf);
  const topShare = percentages[0] ?? 0;

  const evidence: string[] = [`Average of the five K-Means cluster colours: rgb(${r}, ${g}, ${b}).`];
  let margin: number;

  switch (soilType) {
    case "Sandy Soil": {
      margin = Math.min(rf - 180, gf - 140, bf - 100);
      evidence.push(`Satisfies the Sandy rule (R>180, G>140, B>100) \u2014 tightest bound cleared by ${margin.toFixed(0)} units.`);
      break;
    }
    case "Loamy Soil": {
      margin = Math.min(rf - 100, gf - 80, bf - 60, 150 - rf);
      evidence.push(`Satisfies the Loamy rule (100<R<150, G>80, B>60) \u2014 tightest bound cleared by ${margin.toFixed(0)} units.`);
      break;
    }
    case "Clay Soil": {
      margin = Math.min(100 - rf, 80 - gf, 60 - bf);
      evidence.push(`Satisfies the Clay rule (R<100, G<80, B<60) \u2014 tightest bound cleared by ${margin.toFixed(0)} units.`);
      break;
    }
    case "Silty Soil": {
      margin = Math.min(rf - 120, gf - 100, 80 - bf);
      evidence.push(`Satisfies the Silty rule (R>120, G>100, B<80) \u2014 tightest bound cleared by ${margin.toFixed(0)} units.`);
      break;
    }
    default: {
      // Mixed: the classifier's fallback. Confidence direction flips here —
      // the FARTHER this colour sits from every other rule, the more
      // confidently "none of the four apply" is the right call.
      const sandyViol = Math.max(0, 180 - rf, 140 - gf, 100 - bf);
      const loamyViol = Math.max(0, 100 - rf, 80 - gf, 60 - bf, rf - 150);
      const clayViol = Math.max(0, rf - 100, gf - 80, bf - 60);
      const siltyViol = Math.max(0, 120 - rf, 100 - gf, bf - 80);
      margin = Math.min(sandyViol, loamyViol, clayViol, siltyViol);
      evidence.push(
        `Does not clearly satisfy the Sandy, Loamy, Clay, or Silty thresholds \u2014 closest near-miss was ${margin.toFixed(0)} units away, so it falls back to Mixed.`
      );
    }
  }

  evidence.push(
    `Separately, the largest single colour cluster covers ${topShare.toFixed(1)}% of sampled pixels${
      topShare >= 45 ? " \u2014 a fairly uniform, coherent reading." : topShare < 25 ? " \u2014 a fragmented reading spread across several colours." : "."
    }`
  );

  let confidence = marginToConfidence(margin);
  if (topShare >= 45) confidence += 4;
  else if (topShare < 25) confidence -= 6;
  confidence = Math.max(30, Math.min(CONF_CEIL, Math.round(confidence)));

  const band: EvidenceBand = confidence >= 85 ? "high" : confidence >= 65 ? "medium" : "low";
  return { confidence, band, evidence };
}
