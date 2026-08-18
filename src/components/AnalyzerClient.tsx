"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  Zap,
  RotateCcw,
  ImageIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  analyze,
  levelOf,
  pixelsFromImage,
  simulateSampleVariance,
  type AnalysisResult,
  type RGB,
} from "@/lib/soil-engine";
import {
  metricsFromImage,
  evaluateValidation,
  type ValidationReport,
  type ValidationCheck,
  type CheckStatus,
} from "@/lib/image-validation";
import { explainSoilType, type ClassificationEvidence } from "@/lib/evidence";
import { SAMPLE_SOIL_DATA_URI } from "@/lib/sample-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Stage = "idle" | "preview" | "analyzing" | "result";

type Outcome =
  | { kind: "rejected"; report: ValidationReport }
  | { kind: "uncertain"; report: ValidationReport }
  | { kind: "analyzed"; report: ValidationReport; result: AnalysisResult; soilEvidence: ClassificationEvidence };

// "Validate" is new — see VALIDATION_SYSTEM_PROMPT.md and BUILD_LOG.md for
// why it exists and what it can/can't actually check client-side.
const STEPS = ["Capture", "Validate", "Extract", "Classify", "Predict", "Recommend"];
const VALIDATE_STEP_INDEX = 1;

// 150x150 matches the resize documented on /technology — the analyzer
// previously sampled at 50x50, a quiet mismatch fixed alongside this round
// of work (see IMPROVEMENTS.md).
const GRID_SIZE = 150;

const TONE_HEX: Record<string, string> = {
  low: "#b5502f",
  medium: "#9c6b3e",
  high: "#3e6631",
  neutral: "#2f4b33",
};

function LevelBadge({ tone, level }: { tone: string; level: string }) {
  const classes: Record<string, string> = {
    low: "bg-rust/10 text-rust",
    medium: "bg-soil/10 text-soil-text",
    high: "bg-sprout/10 text-sprout-text",
    neutral: "bg-forest/10 text-forest-deep",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${classes[tone]}`}>
      {level}
    </span>
  );
}

const BAND_LABELS: Record<"high" | "medium" | "low", string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

function ConfidenceBadge({
  confidence,
  band,
  labels = BAND_LABELS,
}: {
  confidence: number;
  band: "high" | "medium" | "low";
  labels?: Record<"high" | "medium" | "low", string>;
}) {
  const palette: Record<string, string> = {
    high: "bg-sprout/10 text-sprout-text border-sprout/30",
    medium: "bg-soil/10 text-soil-text border-soil/30",
    low: "bg-rust/10 text-rust border-rust/30",
  };
  const Icon = band === "high" ? ShieldCheck : band === "medium" ? ShieldQuestion : ShieldAlert;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium ${palette[band]}`}>
      <Icon size={13} />
      {labels[band]} &middot; {confidence}%
    </span>
  );
}

function CheckStatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CheckCircle2 size={15} className="text-sprout-text" />;
  if (status === "warn") return <AlertTriangle size={15} className="text-soil-text" />;
  return <XCircle size={15} className="text-rust" />;
}

function CheckList({ checks }: { checks: ValidationCheck[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {checks.map((c) => (
        <li key={c.id} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex-none">
            <CheckStatusIcon status={c.status} />
          </span>
          <span className="text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">{c.label}: </span>
            {c.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Mirrors the literal "Analysis Status" block from VALIDATION_SYSTEM_PROMPT.md. */
function StatusBlock({ report }: { report: ValidationReport }) {
  const lines: string[] =
    report.verdict === "rejected"
      ? ["Analysis Status: Rejected", "", "Reason:", report.primaryReason ?? "", "", "What to do:", report.recommendation ?? ""]
      : [
          "Analysis Status: Uncertain",
          "",
          `Confidence: Low (${report.confidence}%)`,
          "",
          "Reason:",
          report.primaryReason ?? "",
          "",
          "Recommendation:",
          report.recommendation ?? "",
        ];
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-bg-alt p-4 font-mono text-[12.5px] leading-relaxed text-ink-soft">
      {lines.join("\n")}
    </pre>
  );
}

function GateOutcomePanel({
  report,
  onRetry,
}: {
  report: Extract<ValidationReport, { verdict: "rejected" | "uncertain" }> | ValidationReport;
  onRetry: () => void;
}) {
  const rejected = report.verdict === "rejected";
  const tone = rejected
    ? { border: "border-rust/25", bg: "bg-rust/[0.04]", chip: "bg-rust/10 text-rust", label: "Analysis rejected", Icon: ShieldAlert }
    : { border: "border-soil/25", bg: "bg-soil/[0.05]", chip: "bg-soil/10 text-soil-text", label: "Analysis uncertain", Icon: ShieldQuestion };

  return (
    <div className={`flex min-h-[300px] flex-col gap-5 rounded-2xl border ${tone.border} ${tone.bg} p-6`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tone.chip}`}>
          <tone.Icon size={19} />
        </span>
        <div>
          <p className={`font-mono text-xs uppercase tracking-wider ${rejected ? "text-rust" : "text-soil-text"}`}>{tone.label}</p>
          <p className="mt-1 font-serif text-lg font-semibold text-ink">
            {rejected ? "Not a usable soil photo" : "Confidence too low to report"}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-soft">{report.primaryReason}</p>
      <StatusBlock report={report} />
      <details className="group">
        <summary className="cursor-pointer select-none font-mono text-xs uppercase tracking-wide text-ink-faint transition-colors hover:text-ink-soft">
          Full evidence trail
        </summary>
        <div className="mt-3 rounded-xl border border-line bg-surface p-4">
          <CheckList checks={report.checks} />
        </div>
      </details>
      <button
        onClick={onRetry}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-forest"
      >
        <RotateCcw size={14} /> Choose a different image
      </button>
    </div>
  );
}

export default function AnalyzerClient() {
  const [stage, setStage] = useState<Stage>("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number>(-1);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((src: string, sample: boolean) => {
    setImageSrc(src);
    setUsingSample(sample);
    setStage("preview");
    setOutcome(null);
    setActiveStep(-1);
    setDoneSteps(-1);
  }, []);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || !/^image\//.test(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => loadImage(e.target?.result as string, false);
      reader.readAsDataURL(file);
    },
    [loadImage]
  );

  const reset = () => {
    setStage("idle");
    setImageSrc(null);
    setOutcome(null);
    setActiveStep(-1);
    setDoneSteps(-1);
  };

  const runAnalysis = () => {
    if (!imageSrc) return;
    setStage("analyzing");
    setOutcome(null);
    const img = new window.Image();
    img.onload = () => {
      let pixels: RGB[];
      let report: ValidationReport;
      try {
        const rawPixels = pixelsFromImage(img, GRID_SIZE);
        pixels = usingSample ? simulateSampleVariance(rawPixels, GRID_SIZE) : rawPixels;
        const metrics = metricsFromImage(img, pixels, GRID_SIZE);
        report = evaluateValidation(metrics);
      } catch {
        setStage("preview");
        return;
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stepDelay = reduceMotion ? 0 : 420;
      // Steps 1 (Capture) and 2 (Validate) always run. If the gate doesn't
      // clear, the stepper stops there instead of continuing through
      // Extract/Classify/Predict/Recommend — nothing downstream runs on
      // an image the gate didn't accept.
      const stepCount = report.verdict === "ok" ? STEPS.length : VALIDATE_STEP_INDEX + 1;

      let i = 0;
      const tick = () => {
        setActiveStep(i);
        setTimeout(() => {
          setDoneSteps(i);
          i++;
          if (i < stepCount) {
            tick();
            return;
          }
          setActiveStep(-1);
          try {
            if (report.verdict === "ok") {
              const result = analyze(pixels);
              const soilEvidence = explainSoilType(result.colors, result.percentages, result.soilType);
              setOutcome({ kind: "analyzed", report, result, soilEvidence });
            } else {
              setOutcome({ kind: report.verdict, report });
            }
            setStage("result");
          } catch {
            setStage("preview");
          }
        }, stepDelay);
      };
      tick();
    };
    img.onerror = () => setStage("preview");
    img.src = imageSrc;
  };

  const analyzed = outcome?.kind === "analyzed" ? outcome : null;

  const nutrientData = analyzed
    ? [
        { name: "Nitrogen", value: analyzed.result.nutrients.nitrogen, ...levelOf(analyzed.result.nutrients.nitrogen, "nitrogen") },
        { name: "Phosphorus", value: analyzed.result.nutrients.phosphorus, ...levelOf(analyzed.result.nutrients.phosphorus, "phosphorus") },
        { name: "Potassium", value: analyzed.result.nutrients.potassium, ...levelOf(analyzed.result.nutrients.potassium, "potassium") },
      ]
    : [];

  const phInfo = analyzed ? levelOf(analyzed.result.nutrients.ph, "ph") : null;
  const phPct = analyzed ? ((analyzed.result.nutrients.ph - 5.0) / 3.0) * 100 : 0;

  return (
    <div className="rounded-3xl border border-line-strong bg-surface p-5 sm:p-8">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-sprout-text">
          <span className="h-1.5 w-1.5 rounded-full bg-sprout" /> Live in your browser
        </span>
        <h3 className="mt-3 font-serif text-2xl font-semibold text-ink">Run the analysis</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Upload a soil photo — or use the project&rsquo;s own sample image —
          and this panel checks whether the photo is a reasonable soil
          close-up, then runs the real K-Means extraction, classification,
          nutrient prediction, and crop-matching logic. Same core math as
          the FastAPI backend, no server required.
        </p>
      </div>

      {/* steps */}
      <div className="mt-7 flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const active = activeStep === i && stage === "analyzing";
          const done = doneSteps >= i;
          return (
            <div
              key={s}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
                active
                  ? "border-forest bg-forest-10 text-ink"
                  : done
                    ? "border-line-strong text-ink-soft"
                    : "border-line text-ink-faint"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active ? "bg-forest text-white" : done ? "bg-forest-deep/70 text-white" : "bg-bg-alt"
                }`}
              >
                {i + 1}
              </span>
              {s}
            </div>
          );
        })}
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {/* ============ upload / preview column ============ */}
        <div className="flex flex-col">
          {stage === "idle" && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-forest bg-forest-10" : "border-line-strong bg-bg-alt"
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-forest-deep">
                <Upload size={24} />
              </span>
              <p className="font-semibold text-ink">Drop a soil photo here</p>
              <p className="text-sm text-ink-faint">or click to browse — JPEG or PNG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {stage !== "idle" && imageSrc && (
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-line bg-bg-alt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="Selected soil sample" className="absolute inset-0 h-full w-full object-cover" />
              {stage === "analyzing" && (
                <div
                  className="absolute left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-transparent via-forest to-transparent shadow-[0_0_16px_2px_rgba(47,75,51,0.45)]"
                  style={{ animation: "scan 1.1s ease-in-out infinite" }}
                />
              )}
              <span className="absolute bottom-3 left-3 rounded-full border border-line-strong bg-surface/90 px-3 py-1 font-mono text-xs text-ink-soft backdrop-blur">
                {usingSample ? "Sample" : "Your photo"}
              </span>
            </div>
          )}

          {stage === "idle" && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-ink-faint">
                <span>No image handy?</span>
                <button
                  onClick={() => loadImage(SAMPLE_SOIL_DATA_URI, true)}
                  className="font-mono text-sm font-medium text-forest-deep underline-offset-2 hover:underline"
                >
                  Use the project&rsquo;s sample &rarr;
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                The bundled sample is a flat test-fixture image from the
                repo, so we add simulated variance to it for a
                representative result. A photo you upload is analyzed
                exactly as captured — including by the validation step below.
              </p>
            </div>
          )}

          {stage !== "idle" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={runAnalysis}
                disabled={stage === "analyzing"}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
              >
                <Zap size={15} />
                {stage === "analyzing" ? "Analyzing…" : stage === "result" ? "Re-run analysis" : "Analyze soil"}
              </button>
              <button
                onClick={reset}
                disabled={stage === "analyzing"}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-forest disabled:pointer-events-none disabled:opacity-60"
              >
                <RotateCcw size={14} /> Choose different image
              </button>
            </div>
          )}
        </div>

        {/* ============ results column ============ */}
        <div className="min-h-[300px]">
          {!outcome && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-bg-alt p-8 text-center">
              <ImageIcon size={30} className="text-ink-faint" />
              <p className="max-w-xs text-sm text-ink-faint">
                Results will appear here — soil type, dominant colours,
                predicted nutrients, and matching crops. Images that
                don&rsquo;t look like usable soil close-ups are flagged
                instead of guessed.
              </p>
            </div>
          )}

          {(outcome?.kind === "rejected" || outcome?.kind === "uncertain") && (
            <GateOutcomePanel report={outcome.report} onRetry={reset} />
          )}

          {analyzed && (
            <div className="flex flex-col gap-6">
              {/* confidence */}
              <div className="flex flex-wrap items-center gap-3">
                <ConfidenceBadge
                  confidence={analyzed.report.confidence}
                  band={analyzed.report.band}
                  labels={{ high: "High reading confidence", medium: "Medium reading confidence", low: "Low reading confidence" }}
                />
              </div>
              <details className="-mt-2 rounded-xl border border-line bg-bg-alt p-4">
                <summary className="cursor-pointer select-none font-mono text-xs uppercase tracking-wide text-ink-faint transition-colors hover:text-ink-soft">
                  Image evidence behind that confidence score
                </summary>
                <div className="mt-3">
                  <CheckList checks={analyzed.report.checks} />
                </div>
              </details>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-line-strong bg-bg-alt px-5 py-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Classified as</p>
                  <p className="font-serif text-xl font-semibold text-ink">{analyzed.result.soilType}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">pH</p>
                  <p className="font-serif text-xl font-semibold text-ink">
                    {analyzed.result.nutrients.ph} <span className="text-sm font-normal text-ink-soft">{phInfo?.level}</span>
                  </p>
                </div>
              </div>

              <details className="-mt-3 rounded-xl border border-line bg-surface p-4">
                <summary className="flex cursor-pointer select-none items-center justify-between gap-3 font-mono text-xs uppercase tracking-wide text-ink-faint transition-colors hover:text-ink-soft">
                  <span>Why this classification</span>
                  <ConfidenceBadge
                    confidence={analyzed.soilEvidence.confidence}
                    band={analyzed.soilEvidence.band}
                    labels={{ high: "High match", medium: "Medium match", low: "Low match" }}
                  />
                </summary>
                <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-ink-soft">
                  {analyzed.soilEvidence.evidence.map((e, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-ink-faint">&bull;</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </details>

              {/* pH indicator */}
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "linear-gradient(90deg, #b5502f, #9c6b3e 35%, #2f4b33 55%, #6fa05c 75%, #9c6b3e)" }}>
                </div>
                <div className="relative mt-1 h-3">
                  <div
                    className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface bg-ink shadow"
                    style={{ left: `${Math.min(100, Math.max(0, phPct))}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-faint">
                  <span>5.0 acidic</span>
                  <span>6.5 neutral</span>
                  <span>8.0 alkaline</span>
                </div>
              </div>

              {/* colours */}
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-faint">Dominant colours</p>
                <div className="flex flex-wrap gap-3">
                  {analyzed.result.colors.map((c, i) => (
                    <div key={i} className="text-center">
                      <div
                        className="h-11 w-11 rounded-xl border border-black/10"
                        style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
                      />
                      <span className="mt-1 block font-mono text-[11px] text-ink-faint">
                        {analyzed.result.percentages[i].toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NPK chart */}
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-faint">
                  Nitrogen · Phosphorus · Potassium (ppm)
                </p>
                <div className="h-[180px] w-full rounded-xl border border-line bg-bg-alt p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutrientData} margin={{ top: 10, right: 14, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e3dcc8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5b6b54" }} axisLine={{ stroke: "#e3dcc8" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#5b6b54" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(47,75,51,0.06)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e3dcc8",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={54}>
                        {nutrientData.map((d, i) => (
                          <Cell key={i} fill={TONE_HEX[d.tone]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {nutrientData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-soft">
                      {d.name}
                      <LevelBadge tone={d.tone} level={d.level} />
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                  pH, Nitrogen, Phosphorus, and Potassium are all derived
                  from the same colour reading above via SAWA&rsquo;s
                  heuristic model (see Technology) — they inherit its
                  confidence and are not independently lab-verified.
                </p>
              </div>

              {/* crops */}
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-faint">Recommended crops</p>
                {analyzed.result.crops.length ? (
                  <div className="flex flex-wrap gap-2">
                    {analyzed.result.crops.map((crop) => (
                      <span
                        key={crop}
                        className="rounded-full border border-forest/20 bg-forest-10 px-3.5 py-1.5 text-sm text-forest-deep"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">
                    No strong matches in the 15-crop database for this exact
                    profile — real edge cases like this are part of why the
                    model keeps improving.
                  </p>
                )}
              </div>

              <p className="border-t border-dashed border-line pt-4 text-xs leading-relaxed text-ink-faint">
                This runs the exact classification, prediction, and
                crop-matching logic from <b className="text-ink-soft">backend/server.py</b>,
                ported to TypeScript and executing entirely in this tab —
                nothing is uploaded anywhere. The image-quality and
                confidence checks above run first and are a client-side
                addition on top of that ported algorithm, not part of the
                original <b className="text-ink-soft">backend/server.py</b> —
                see <b className="text-ink-soft">VALIDATION_SYSTEM_PROMPT.md</b> for
                the full spec. The deployed app additionally saves each
                result to MongoDB for its history panel, which this static
                preview doesn&rsquo;t include.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
