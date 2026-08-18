"use client";

import { useEffect, useRef, useState } from "react";
import {
  kmeans,
  pixelsFromImage,
  simulateSampleVariance,
  type RGB,
} from "@/lib/soil-engine";
import { SAMPLE_SOIL_DATA_URI } from "@/lib/sample-data";

const GRID = 24;
const HOMES: [number, number][] = [
  [0.5, 0.46],
  [0.77, 0.3],
  [0.78, 0.7],
  [0.27, 0.74],
  [0.21, 0.28],
];

type Particle = {
  gx: number;
  gy: number;
  hx: number;
  hy: number;
  cluster: number;
  r: number;
  jitterPhase: number;
};

const PHASES = [
  { name: "scatter-hold", dur: 1700 },
  { name: "converge", dur: 1900 },
  { name: "cluster-hold", dur: 3400 },
  { name: "scatter", dur: 1900 },
] as const;

function ease(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function clamp01(v: number) {
  return Math.max(0.02, Math.min(0.98, v));
}

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<RGB[]>([
    [124, 69, 48],
    [169, 122, 76],
    [217, 194, 155],
    [91, 65, 48],
    [142, 106, 70],
  ]);
  const [percentages, setPercentages] = useState<number[]>([20, 20, 20, 20, 20]);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [scanOpacity, setScanOpacity] = useState(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const img = new Image();
    img.onload = () => {
      try {
        const rawPixels = pixelsFromImage(img, GRID);
        const pixels = simulateSampleVariance(rawPixels, GRID);
        const result = kmeans(pixels, 5, 10);
        setColors(result.colors);
        setPercentages(result.percentages);

        particlesRef.current = pixels.map((_, i) => {
          const col = i % GRID,
            row = Math.floor(i / GRID);
          const gx = 0.08 + (col / (GRID - 1)) * 0.84;
          const gy = 0.08 + (row / (GRID - 1)) * 0.84;
          const cluster = result.labels[i];
          const home = HOMES[cluster % HOMES.length];
          const spread = 0.05 + Math.sqrt(result.percentages[cluster] / 100) * 0.16;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * spread;
          return {
            gx,
            gy,
            hx: clamp01(home[0] + Math.cos(angle) * radius),
            hy: clamp01(home[1] + Math.sin(angle) * radius),
            cluster,
            r: 1.6 + Math.random() * 1.6,
            jitterPhase: Math.random() * Math.PI * 2,
          };
        });

        start(result.colors, result.percentages);
      } catch {
        /* decorative element — hero copy stands alone if this fails */
      }
    };
    img.src = SAMPLE_SOIL_DATA_URI;

    function sizeCanvas() {
      const canvas = canvasRef.current;
      const mount = mountRef.current;
      if (!canvas || !mount) return { w: 0, h: 0, dpr: 1 };
      const rect = mount.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: rect.height, dpr };
    }

    function start(cols: RGB[], pcts: number[]) {
      let phaseIndex = reduceMotion ? 2 : 0;
      let phaseStart = 0;

      function render(now: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { w, h } = sizeCanvas();
        const ctx = canvas.getContext("2d")!;
        if (!phaseStart) phaseStart = now;

        const phase = PHASES[phaseIndex];
        let t = (now - phaseStart) / phase.dur;
        if (t >= 1 && !reduceMotion) {
          t = 1;
          phaseIndex = (phaseIndex + 1) % PHASES.length;
          phaseStart = now;
        }
        const name = phase.name;
        setScanOpacity(name === "converge" || name === "scatter" ? 1 : 0);
        setLabelsVisible(name === "cluster-hold" && t > 0.15);

        let mix: number;
        if (reduceMotion) mix = 1;
        else if (name === "scatter-hold") mix = 0;
        else if (name === "converge") mix = ease(t);
        else if (name === "cluster-hold") mix = 1;
        else mix = 1 - ease(t);

        ctx.clearRect(0, 0, w, h);

        if (mix > 0.5) {
          const glowAlpha = (mix - 0.5) * 2;
          HOMES.forEach((home, i) => {
            if (i >= cols.length) return;
            const [r, g, b] = cols[i];
            const gx = home[0] * w,
              gy = home[1] * h;
            const rad = 60 + Math.sqrt(pcts[i] / 100) * 90;
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
            grad.addColorStop(0, `rgba(${r},${g},${b},${0.22 * glowAlpha})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(gx, gy, rad, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        for (let c = 0; c < cols.length; c++) {
          const [r, g, b] = cols[c];
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath();
          for (let i = 0; i < particlesRef.current.length; i++) {
            const p = particlesRef.current[i];
            if (p.cluster !== c) continue;
            const wob = reduceMotion ? 0 : Math.sin(now / 900 + p.jitterPhase) * 0.004 * mix;
            const px = (p.gx + (p.hx - p.gx) * mix) * w;
            const py = (p.gy + (p.hy - p.gy) * mix + wob) * h;
            ctx.moveTo(px + p.r, py);
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
          }
          ctx.fill();
        }

        if (!reduceMotion) raf = requestAnimationFrame(render);
      }

      raf = requestAnimationFrame(render);
    }

    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative aspect-square w-full max-w-[540px] overflow-hidden rounded-3xl border border-line bg-surface shadow-sm"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <div
        aria-hidden
        className="absolute left-[6%] right-[6%] h-[1.5px] bg-gradient-to-r from-transparent via-forest to-transparent transition-opacity duration-500"
        style={{ opacity: scanOpacity, animation: "scan 2.4s ease-in-out infinite" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {HOMES.map((home, i) => {
          if (i >= colors.length) return null;
          const [r, g, b] = colors[i];
          return (
            <div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong bg-surface/90 px-2.5 py-1.5 font-mono text-xs text-ink shadow-sm backdrop-blur transition-opacity duration-500"
              style={{
                left: `${home[0] * 100}%`,
                top: `${home[1] * 100}%`,
                opacity: labelsVisible ? 1 : 0,
              }}
            >
              <span
                className="h-3.5 w-3.5 flex-none rounded-full border border-white/40"
                style={{ background: `rgb(${r},${g},${b})` }}
              />
              <b className="font-semibold">{percentages[i]?.toFixed(1)}%</b>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-surface/95 to-transparent px-5 py-4 font-mono text-xs text-ink-faint">
        <span>
          K-Means &middot; <b className="text-ink-soft">k=5</b> &middot; live on sample_soil.jpg
        </span>
        <span>RGB</span>
      </div>
    </div>
  );
}
