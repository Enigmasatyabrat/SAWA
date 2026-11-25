import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import HeroVisual from "@/components/HeroVisual";
import Marquee from "@/components/Marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, StatCard, PrimaryButton, SecondaryButton, CTABanner } from "@/components/ui";
import Photo from "@/components/Photo";
import { PHOTOS } from "@/lib/photos";

const PIPELINE = [
  {
    title: "The colour signature",
    body: "K-Means clustering pulls the five dominant colours out of the image and uses them to classify the soil as Sandy, Loamy, Clay, Silty, or Mixed.",
    href: "/technology",
    cta: "See the pipeline",
  },
  {
    title: "What's in the soil",
    body: "A darkness-weighted heuristic model estimates pH and Nitrogen–Phosphorus–Potassium levels from the extracted colour data.",
    href: "/technology",
    cta: "See the model",
  },
  {
    title: "What will grow there",
    body: "The nutrient profile is matched against a 15-crop requirement database, returning up to eight crops actually suited to that soil.",
    href: "/analyzer",
    cta: "Try it yourself",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
          <div>
            <h1 className="text-balance font-serif text-5xl font-semibold leading-[1] tracking-[-0.025em] text-ink sm:text-6xl lg:text-[4.75rem]">
              Read your soil from a photo.
            </h1>
            <p className="mt-8 max-w-lg text-xl leading-relaxed text-ink">
              SAWA, the Soil Analysis Web App, turns one photo into its main
              colours, a likely soil type, rough nutrient bands and crops to
              consider. A free first read, not a lab test.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PrimaryButton href="/analyzer">Try the live analyzer</PrimaryButton>
              <SecondaryButton href="/technology">See how it works</SecondaryButton>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
              <span>Built by</span>
              <span className="font-semibold text-ink-soft">Satyabrat Mishra</span>
              <span>— B.Tech CSE (AI &amp; ML), ITM GIDA, Gorakhpur</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      <Marquee />

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <Photo photo={PHOTOS.ploughedField} aspect="aspect-[16/9] sm:aspect-[21/9]" />
      </section>

      {/* ================= WHAT SAWA DOES ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="max-w-xl">
          <h2 className=" text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            One photo, three honest steps.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {PIPELINE.map((p) => (
            <StaggerItem key={p.title}>
              <div className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-7 transition-all hover:-translate-y-1 hover:border-forest/40 hover:shadow-lg hover:shadow-forest/5">
                <h3 className="mt-3 font-serif text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mt-2.5 flex-1 text-base leading-relaxed text-ink">{p.body}</p>
                <Link
                  href={p.href}
                  className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink-faint transition-colors group-hover:text-forest-deep"
                >
                  {p.cta}
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ================= STATS ================= */}
      <section className="border-y border-line bg-bg-alt py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard value="5" label="Colours extracted" compare="via K-Means per image" />
              <StatCard value="5" label="Soil classifications" compare="Sandy, Loamy, Clay, Silty, Mixed" />
              <StatCard value="15" label="Crops in the database" compare="pH + N-P-K matched" />
              <StatCard value="4" label="Signals predicted" compare="pH, Nitrogen, Phosphorus, Potassium" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= ABOUT TEASER ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <p className="text-balance font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl">
            Lab soil testing is accurate, and largely out of reach.{" "}
            <span className="text-forest-deep">
              SAWA is a bet that a photograph and a bit of applied colour
              science
            </span>{" "}
            can put a first, useful read on soil health in front of anyone
            with a phone.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
            <p className="max-w-md text-base text-ink">
              Built solo, end to end: Next.js and Tailwind for the site and
              its API, MongoDB for history, and K-Means colour clustering on
              every photo.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-forest-deep transition-colors hover:text-forest"
            >
              Read the full story
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-10 sm:grid-cols-2">
        <Photo photo={PHOTOS.ploughingBengal} aspect="aspect-[4/3]" sizes="(min-width: 640px) 50vw, 100vw" />
        <Photo photo={PHOTOS.soilProfilingIndia} aspect="aspect-[4/3]" sizes="(min-width: 640px) 50vw, 100vw" />
      </section>

      {/* ================= VALIDATION ================= */}
      <section className="border-t border-line bg-bg-alt py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-xl">
            <h2 className=" text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Tested before it was called finished.
            </h2>
          </Reveal>

          <Stagger className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                tag: "Backend suite",
                quote: "10 of 10 backend endpoints passing — upload, colour extraction, classification, and history all verified.",
                src: "automated test log, backend",
              },
              {
                tag: "Cross-device",
                quote: "Confirmed working on desktop (1920×1080) and mobile (390×844) viewports, upload through results.",
                src: "automated test log, frontend",
              },
              {
                tag: "Resilience",
                quote: "Falls back to an in-memory store automatically if MongoDB is briefly unreachable — no failed analysis.",
                src: "backend/server.py",
              },
            ].map((v) => (
              <StaggerItem key={v.tag}>
                <div className="h-full rounded-2xl border border-line bg-surface p-7">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sprout-text">
                    <Sparkles size={13} />
                    {v.tag}
                  </div>
                  <p className="mt-4 font-serif text-lg italic leading-snug text-ink">
                    &ldquo;{v.quote}&rdquo;
                  </p>
                  <p className="mt-4 font-mono text-xs text-ink-faint">— {v.src}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <Photo photo={PHOTOS.terracedRice} aspect="aspect-[16/9] sm:aspect-[21/9]" />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal scale>
          <CTABanner
            eyebrow="Try it now"
            title="Try it on your own soil."
            lead="The live analyzer validates your photo in the browser, then runs the same K-Means, classification, and recommendation logic as the FastAPI backend — now served by SAWA's own API."
            primary={{ href: "/analyzer", label: "Open the analyzer" }}
            secondary={{ href: "/contact", label: "Get in touch" }}
          />
        </Reveal>
      </section>
    </>
  );
}
