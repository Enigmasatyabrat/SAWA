import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, CTABanner } from "@/components/ui";

const PIPELINE = [
  { n: "01", title: "Capture", body: "You take or choose a photo of soil — a patch of ground, a handful, a core sample. JPEG or PNG, any reasonable size." },
  { n: "02", title: "Extract", body: "The image resizes to 150×150 and scikit-learn's KMeans(n_clusters=5) clusters every pixel into five colour centroids, each carrying a share of the frame as a percentage." },
  { n: "03", title: "Classify", body: "The five colours average into one signal colour. RGB threshold rules map that signal onto one of five soil types: Sandy, Loamy, Clay, Silty, or Mixed." },
  { n: "04", title: "Predict", body: "A darkness factor computed from the average colour drives four heuristic estimates — pH, Nitrogen, Phosphorus, Potassium — each clamped to a realistic agronomic range." },
  { n: "05", title: "Recommend", body: "The predicted profile is checked against a 15-crop database — pH range plus an N-P-K requirement level per crop — and up to eight matching crops come back." },
  { n: "06", title: "Remember", body: "The full result — colours, soil type, nutrients, and crop list — saves to MongoDB with a timestamp, ready to reopen from the history panel." },
];

const STACK = [
  { n: "01", name: "React", role: "Component-driven UI for upload, results, and history." },
  { n: "02", name: "Tailwind CSS", role: "Utility-first styling across the whole frontend." },
  { n: "03", name: "FastAPI", role: "Async Python API framework serving every endpoint." },
  { n: "04", name: "Python 3.10+", role: "Runtime for the backend and the analysis pipeline." },
  { n: "05", name: "scikit-learn", role: "K-Means clustering for dominant colour extraction." },
  { n: "06", name: "Pillow", role: "Image decoding and resizing before analysis." },
  { n: "07", name: "NumPy", role: "Array math behind the colour and nutrient calculations." },
  { n: "08", name: "MongoDB", role: "Document store for every saved analysis." },
  { n: "09", name: "Motor", role: "Async MongoDB driver so requests never block." },
  { n: "10", name: "Pydantic", role: "Request and response validation for the API." },
  { n: "11", name: "Axios", role: "HTTP client wiring the React frontend to FastAPI." },
  { n: "12", name: "Docker", role: "Containerized runtime — the fix for inconsistent cloud builds." },
];

function ArchNode({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-line-strong bg-surface p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-forest-deep">{tag}</p>
      <p className="mt-2 font-serif text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

export default function TechnologyPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-14 sm:pt-20">
        <Reveal>
          <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-forest-deep">
            <ArrowLeft size={14} /> Back home
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-6 max-w-2xl">
            <Eyebrow>Technology</Eyebrow>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              How a photograph becomes a recommendation.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Six steps, three services, one straight line from an uploaded
              image to a shortlist of crops — plus a validation gate in
              front of all of it, deciding whether there&rsquo;s enough
              evidence to run the pipeline at all.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ================= VALIDATION GATE (client-side addition) ================= */}
      <section className="mx-auto max-w-4xl px-6 pt-6">
        <Reveal className="rounded-2xl border border-forest/25 bg-forest-10 p-6 sm:p-7">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-surface text-forest-deep">
              <ShieldCheck size={19} />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-forest-deep">
                Client-side addition &middot; not part of backend/server.py
              </p>
              <h3 className="mt-1.5 font-serif text-xl font-semibold text-ink">
                Before Capture even reaches Extract: does this look like soil?
              </h3>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                The live Analyzer runs a validation gate first. Colour
                composition, exposure, resolution, and local-contrast
                (texture) statistics are measured from the same pixel grid
                K-Means uses, then combined into a 0-100% confidence score.
                Images dominated by sky, foliage, or blank/blown-out frames
                are rejected outright; anything that clears rejection but
                still scores below 70% is reported as{" "}
                <span className="text-soil-text">Uncertain</span> instead
                of guessed. Only images at Medium (70&ndash;89%) or High
                (&ge;90%) confidence reach Extract, and that confidence
                travels with the result — shown on every prediction, not
                just computed and discarded.
              </p>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                This isn&rsquo;t in the Python backend and doesn&rsquo;t
                pretend to be — it&rsquo;s a heuristic, signal-processing
                approximation of what a trained vision model would do,
                added to this static build so the demo abstains on a photo
                of the sky instead of confidently misreading it. The full
                target spec — including what a model-backed version would
                add — lives in{" "}
                <b className="text-ink-soft">VALIDATION_SYSTEM_PROMPT.md</b>;
                the implementation is{" "}
                <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[13px] text-soil-text">
                  src/lib/image-validation.ts
                </code>
                .
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= PIPELINE ================= */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="relative">
          <div className="absolute bottom-2 left-[21px] top-2 w-px bg-line-strong" aria-hidden />
          <div className="flex flex-col gap-11">
            {PIPELINE.map((p) => (
              <Reveal key={p.n} className="relative pl-16">
                <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-sm text-forest-deep">
                  {p.n}
                </span>
                <h3 className="font-serif text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  {p.title === "Extract" ? (
                    <>The image resizes to 150×150 and scikit-learn&rsquo;s{" "}
                    <code className="rounded-md bg-bg-alt px-1.5 py-0.5 font-mono text-[13px] text-soil-text">
                      KMeans(n_clusters=5)
                    </code>{" "}
                    clusters every pixel into five colour centroids, each carrying a share of the frame as a percentage.</>
                  ) : (
                    p.body
                  )}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE ================= */}
      <section className="border-y border-line bg-bg-alt py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-10 max-w-xl">
            <Eyebrow>Architecture</Eyebrow>
            <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Three services, one request at a time.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              A deliberately simple three-tier layout — nothing that needed a
              diagram this clean actually needed to be more complicated than
              it is.
            </p>
          </Reveal>

          <Reveal>
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <ArchNode tag="Client" title="React + Tailwind CSS" body="Upload UI, results, and history — rendered in the browser." />
                <ArrowRight className="mx-auto hidden flex-none text-line-strong sm:block" size={20} />
                <ArchNode tag="API" title="FastAPI" body="Runs K-Means extraction and the heuristic models, returns JSON." />
                <ArrowRight className="mx-auto hidden flex-none text-line-strong sm:block" size={20} />
                <ArchNode tag="Database" title="MongoDB via Motor" body="Stores every analysis async; falls back to memory if unreachable." />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-sm text-ink-faint">
              Containerized with Docker — one Dockerfile pins the exact
              runtime the app expects, so a build behaves the same anywhere
              it&rsquo;s deployed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= STACK ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="mb-10">
          <Eyebrow>The stack</Eyebrow>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Twelve tools, each earning its place.
          </h2>
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" stagger={0.04}>
          {STACK.map((s) => (
            <StaggerItem key={s.n}>
              <div className="h-full rounded-xl border border-line bg-surface p-5 transition-colors hover:border-forest/40">
                <span className="font-mono text-xs text-forest-deep">{s.n}</span>
                <p className="mt-2.5 font-semibold text-ink">{s.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.role}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal scale>
          <CTABanner
            eyebrow="Run the pipeline yourself"
            title="Every step above, live in your browser."
            lead="The analyzer runs this exact logic client-side — upload a photo and watch it work."
            primary={{ href: "/analyzer", label: "Open the analyzer" }}
            secondary={{ href: "/about", label: "Back to the story" }}
          />
        </Reveal>
      </section>
    </>
  );
}
