/**
 * soil-engine.ts
 * A faithful client-side port of SAWA's backend pipeline (backend/server.py):
 * K-Means colour extraction -> soil classification -> heuristic nutrient
 * prediction -> crop-database matching. Same constants, same thresholds,
 * same math as the FastAPI implementation — just running in the browser.
 */

export type RGB = [number, number, number];

export type CropRequirement = {
  ph: [number, number];
  n: "low" | "medium" | "high";
  p: "low" | "medium" | "high";
  k: "low" | "medium" | "high";
};

export const CROP_DATABASE: Record<string, CropRequirement> = {
  Tomato: { ph: [6.0, 6.8], n: "high", p: "medium", k: "high" },
  "Sweet Corn": { ph: [6.0, 6.8], n: "high", p: "medium", k: "medium" },
  Lettuce: { ph: [6.0, 7.0], n: "medium", p: "medium", k: "high" },
  Carrots: { ph: [6.0, 7.0], n: "low", p: "medium", k: "high" },
  Potatoes: { ph: [5.8, 6.2], n: "medium", p: "high", k: "high" },
  Beans: { ph: [6.0, 7.0], n: "low", p: "medium", k: "medium" },
  Peppers: { ph: [6.0, 6.8], n: "medium", p: "medium", k: "high" },
  Spinach: { ph: [6.0, 7.5], n: "high", p: "medium", k: "high" },
  Broccoli: { ph: [6.0, 7.0], n: "high", p: "medium", k: "medium" },
  Cabbage: { ph: [6.0, 6.5], n: "high", p: "medium", k: "medium" },
  Wheat: { ph: [6.0, 7.0], n: "high", p: "medium", k: "medium" },
  Rice: { ph: [5.5, 6.5], n: "high", p: "medium", k: "medium" },
  Soybeans: { ph: [6.0, 6.8], n: "low", p: "medium", k: "high" },
  Sunflower: { ph: [6.0, 7.5], n: "medium", p: "medium", k: "high" },
  Cucumber: { ph: [6.0, 7.0], n: "medium", p: "medium", k: "high" },
};

export type SoilType = "Sandy Soil" | "Loamy Soil" | "Clay Soil" | "Silty Soil" | "Mixed Soil";

export type Nutrients = {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
};

export type KMeansResult = {
  colors: RGB[];
  percentages: number[];
  labels: number[];
};

export type AnalysisResult = {
  colors: RGB[];
  percentages: number[];
  soilType: SoilType;
  nutrients: Nutrients;
  crops: string[];
};

function dist2(a: RGB, b: RGB) {
  const dr = a[0] - b[0],
    dg = a[1] - b[1],
    db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

export function avgColor(colors: RGB[]): RGB {
  const n = colors.length;
  const s = colors.reduce<[number, number, number]>(
    (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
    [0, 0, 0]
  );
  return [s[0] / n, s[1] / n, s[2] / n];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function gaussianNoise(sd: number) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

/**
 * K-Means clustering on an array of [r,g,b] pixels. Mirrors sklearn's
 * KMeans(n_clusters=5) used server-side, with farthest-point seeding in
 * place of n_init restarts, kept light enough to run in-browser.
 */
export function kmeans(pixels: RGB[], k = 5, iterations = 10): KMeansResult {
  if (pixels.length < k) {
    while (pixels.length < k) pixels = pixels.concat(pixels);
  }
  let centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];
  const sampleStep = Math.max(1, Math.floor(pixels.length / 400));
  while (centroids.length < k) {
    let best: RGB = pixels[0];
    let bestDist = -1;
    for (let i = 0; i < pixels.length; i += sampleStep) {
      const p = pixels[i];
      let d = Infinity;
      for (let c = 0; c < centroids.length; c++) d = Math.min(d, dist2(p, centroids[c]));
      if (d > bestDist) {
        bestDist = d;
        best = p;
      }
    }
    centroids.push(best);
  }

  const labels = new Array(pixels.length).fill(0);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let bd = Infinity,
        bl = 0;
      for (let c = 0; c < k; c++) {
        const d = dist2(pixels[i], centroids[c]);
        if (d < bd) {
          bd = d;
          bl = c;
        }
      }
      labels[i] = bl;
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < pixels.length; i++) {
      const l = labels[i],
        p = pixels[i];
      sums[l][0] += p[0];
      sums[l][1] += p[1];
      sums[l][2] += p[2];
      sums[l][3] += 1;
    }
    centroids = sums.map((s, idx): RGB =>
      s[3] > 0 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centroids[idx]
    );
  }

  const counts = new Array(k).fill(0);
  labels.forEach((l: number) => counts[l]++);
  const total = pixels.length;
  const percentages = counts.map((c) => Math.round((c / total) * 10000) / 100);
  const colors: RGB[] = centroids.map((c) => c.map((v) => Math.round(v)) as RGB);

  const order = colors.map((_, i) => i).sort((a, b) => percentages[b] - percentages[a]);
  const rank = new Array(k);
  order.forEach((origIdx, newIdx) => {
    rank[origIdx] = newIdx;
  });

  return {
    colors: order.map((i) => colors[i]),
    percentages: order.map((i) => percentages[i]),
    labels: labels.map((l: number) => rank[l]),
  };
}

export function classifySoilType(colors: RGB[]): SoilType {
  const [r, g, b] = avgColor(colors);
  if (r > 180 && g > 140 && b > 100) return "Sandy Soil";
  if (r > 100 && g > 80 && b > 60 && r < 150) return "Loamy Soil";
  if (r < 100 && g < 80 && b < 60) return "Clay Soil";
  if (r > 120 && g > 100 && b < 80) return "Silty Soil";
  return "Mixed Soil";
}

export function predictNutrients(colors: RGB[], soilType: SoilType): Nutrients {
  const [r, g, b] = avgColor(colors);
  const darkness = 1 - (r + g + b) / (3 * 255);

  let ph = 7.5 - darkness * 2;
  ph = clamp(ph, 5.0, 8.0);

  let nitrogen = darkness * 100 + gaussianNoise(10);
  nitrogen = clamp(nitrogen, 10, 150);

  let phosphorus = (darkness * 0.7 + 0.3) * 80 + gaussianNoise(8);
  phosphorus = clamp(phosphorus, 5, 100);

  let potassium: number;
  if (soilType === "Clay Soil") potassium = 80 + gaussianNoise(15);
  else if (soilType === "Sandy Soil") potassium = 40 + gaussianNoise(10);
  else potassium = 60 + gaussianNoise(12);
  potassium = clamp(potassium, 20, 120);

  return {
    ph: Math.round(ph * 10) / 10,
    nitrogen: Math.round(nitrogen * 10) / 10,
    phosphorus: Math.round(phosphorus * 10) / 10,
    potassium: Math.round(potassium * 10) / 10,
  };
}

export type LevelInfo = { level: string; tone: "low" | "medium" | "high" | "neutral" };

export function levelOf(value: number, type: "ph" | "nitrogen" | "phosphorus" | "potassium"): LevelInfo {
  if (type === "ph") {
    if (value < 6.0) return { level: "Acidic", tone: "low" };
    if (value > 7.5) return { level: "Alkaline", tone: "neutral" };
    return { level: "Neutral", tone: "high" };
  }
  const thresholds: Record<string, [number, number]> = {
    nitrogen: [40, 80],
    phosphorus: [30, 60],
    potassium: [40, 70],
  };
  const [low, high] = thresholds[type] ?? [30, 60];
  if (value < low) return { level: "Low", tone: "low" };
  if (value > high) return { level: "High", tone: "high" };
  return { level: "Medium", tone: "medium" };
}

export function recommendCrops(n: Nutrients): string[] {
  const nLevel = n.nitrogen > 80 ? "high" : n.nitrogen > 40 ? "medium" : "low";
  const pLevel = n.phosphorus > 60 ? "high" : n.phosphorus > 30 ? "medium" : "low";
  const kLevel = n.potassium > 70 ? "high" : n.potassium > 40 ? "medium" : "low";
  const suitable: string[] = [];
  for (const crop in CROP_DATABASE) {
    const req = CROP_DATABASE[crop];
    const phOk = n.ph >= req.ph[0] && n.ph <= req.ph[1];
    const nOk = (req.n === "high" && (nLevel === "high" || nLevel === "medium")) || req.n === "medium" || req.n === "low";
    const pOk = (req.p === "high" && (pLevel === "high" || pLevel === "medium")) || req.p === "medium" || req.p === "low";
    const kOk = (req.k === "high" && (kLevel === "high" || kLevel === "medium")) || req.k === "medium" || req.k === "low";
    if (phOk && nOk && pOk && kOk) suitable.push(crop);
  }
  return suitable.slice(0, 8);
}

export function analyze(pixels: RGB[]): AnalysisResult {
  const { colors, percentages } = kmeans(pixels, 5, 10);
  const soilType = classifySoilType(colors);
  const nutrients = predictNutrients(colors, soilType);
  const crops = recommendCrops(nutrients);
  return { colors, percentages, soilType, nutrients, crops };
}

/** Extract [r,g,b] pixel array from an image element via an offscreen canvas. */
export function pixelsFromImage(img: HTMLImageElement, sampleSize = 48): RGB[] {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixels;
}

function seededRand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
function clampByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/**
 * The bundled sample_soil.jpg (from the project's own test fixtures) is a
 * flat, single-colour image with zero natural variance, by design — it's a
 * stable input for backend unit tests, not a scenic photo. A real soil photo
 * always carries some — lighting falloff, grain, texture — which is what
 * lets K-Means find five meaningfully different colours instead of one.
 * This simulates that, deterministically, and is applied ONLY to the bundled
 * sample image — never to a photo a visitor actually uploads.
 */
export function simulateSampleVariance(pixels: RGB[], sampleSize: number): RGB[] {
  return pixels.map((p, i) => {
    const col = i % sampleSize,
      row = Math.floor(i / sampleSize);
    const nx = col / (sampleSize - 1),
      ny = row / (sampleSize - 1);
    const gradient = (Math.sin(nx * 3.1 + 0.4) * 0.5 + Math.cos(ny * 2.3 - 0.6) * 0.5) * 26;
    const grain = (seededRand(i * 7.13) - 0.5) * 34;
    const shift = gradient + grain;
    return [clampByte(p[0] + shift), clampByte(p[1] + shift * 0.85), clampByte(p[2] + shift * 0.7)];
  });
}

export const SOIL_TYPE_LABELS: SoilType[] = ["Sandy Soil", "Loamy Soil", "Clay Soil", "Silty Soil", "Mixed Soil"];
