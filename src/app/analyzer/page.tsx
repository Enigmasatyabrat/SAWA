import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnalyzerClient from "@/components/AnalyzerClient";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, CTABanner } from "@/components/ui";
import { CROP_DATABASE } from "@/lib/soil-engine";

const SOIL_TYPES = [
  { name: "Sandy Soil", desc: "Bright, warm signal — R>180, G>140, B>100. Light, well-drained.", k: "40 ppm", color: "linear-gradient(160deg, #d9c29b, #b39d76)" },
  { name: "Loamy Soil", desc: "The middle range — moderate R/G/B with red under 150. Balanced.", k: "60 ppm", color: "linear-gradient(160deg, #a97a4c, #7c5a38)" },
  { name: "Clay Soil", desc: "Dark on all channels — R<100, G<80, B<60. Dense, retentive.", k: "80 ppm", color: "linear-gradient(160deg, #7c4530, #4a2a1c)" },
  { name: "Silty Soil", desc: "Warm mid-tones, low blue — R>120, G>100, B<80.", k: "60 ppm", color: "linear-gradient(160deg, #be9a5f, #93733f)" },
  { name: "Mixed Soil", desc: "The fallback — any signature that doesn't clearly match the other four.", k: "60 ppm", color: "linear-gradient(160deg, #8e6a46, #5c4630)" },
];

const REQ_TONE: Record<string, string> = {
  low: "text-ink-faint",
  medium: "text-soil-text",
  high: "text-sprout-text",
};

export default function AnalyzerPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 sm:pt-20">
        <Reveal>
          <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-forest-deep">
            <ArrowLeft size={14} /> Back home
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-6 max-w-2xl">
            <Eyebrow>Analyzer</Eyebrow>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              Stop reading about it. Run it.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              A real, working port of SAWA&rsquo;s pipeline — upload a photo
              below and get an actual analysis back from the live API.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <Reveal scale>
          <AnalyzerClient />
        </Reveal>
      </section>

      {/* ================= SOIL TYPES ================= */}
      <section className="border-y border-line bg-bg-alt py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-10 max-w-xl">
            <Eyebrow>Classification reference</Eyebrow>
            <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Five soil types, five colour signatures.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              What the classifier checks for, and how each type shifts the
              potassium baseline in the nutrient model.
            </p>
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5" stagger={0.05}>
            {SOIL_TYPES.map((s) => (
              <StaggerItem key={s.name}>
                <div className="h-full overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="h-20" style={{ background: s.color }} />
                  <div className="p-4">
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.desc}</p>
                    <p className="mt-2 font-mono text-[11px] text-ink-faint">K baseline: {s.k}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ================= CROP DATABASE ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="mb-10 max-w-xl">
          <Eyebrow>The full database</Eyebrow>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Fifteen crops, matched on pH and N-P-K.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Every crop the recommendation engine can suggest, with the exact
            pH range and nutrient requirement level each one needs.
          </p>
        </Reveal>
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.03}>
          {Object.entries(CROP_DATABASE).map(([crop, req]) => (
            <StaggerItem key={crop}>
              <div className="h-full rounded-xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{crop}</p>
                  <span className="font-mono text-xs text-ink-faint">
                    pH {req.ph[0].toFixed(1)}–{req.ph[1].toFixed(1)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
                  <span className={`rounded-full bg-bg-alt px-2.5 py-1 ${REQ_TONE[req.n]}`}>N {req.n}</span>
                  <span className={`rounded-full bg-bg-alt px-2.5 py-1 ${REQ_TONE[req.p]}`}>P {req.p}</span>
                  <span className={`rounded-full bg-bg-alt px-2.5 py-1 ${REQ_TONE[req.k]}`}>K {req.k}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal scale>
          <CTABanner
            eyebrow="Liked what you saw"
            title="There's more where that came from."
            lead="Read the full build story, or reach out directly."
            primary={{ href: "/about", label: "Read the story" }}
            secondary={{ href: "/contact", label: "Get in touch" }}
          />
        </Reveal>
      </section>
    </>
  );
}
