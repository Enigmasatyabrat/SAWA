import { ArrowLeft, CheckCircle2, Compass, Microscope, Sprout } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, CTABanner } from "@/components/ui";

const SHIPPED = [
  {
    t: "Confidence indicators",
    d: "The analyzer now validates every photo before scoring it — rejecting sky/foliage/blank frames outright, flagging low-evidence images as Uncertain instead of guessing, and showing a 0\u2013100% confidence score plus its evidence on every result.",
  },
  {
    t: "150\u00d7150 sampling, for real",
    d: "The in-browser analyzer was quietly sampling at 50\u00d750 while this page described 150\u00d7150. It now actually samples at 150\u00d7150, matching the documented pipeline exactly.",
  },
];

const GROUPS = [
  {
    icon: Microscope,
    tag: "Near-term",
    title: "Make the predictions trustworthy",
    items: [
      { t: "Lab-verified calibration", d: "Check the colour-to-nutrient heuristics against real lab test results instead of literature-only correlations." },
      { t: "Expanded crop database", d: "Grow past 15 crops, including regional varieties beyond the current set." },
    ],
  },
  {
    icon: Sprout,
    tag: "Medium-term",
    title: "Replace heuristics with a trained model",
    items: [
      { t: "Trained ML model", d: "Swap the current rule-based colour thresholds for a model trained on labelled image + lab-result pairs." },
      { t: "Multi-sample averaging", d: "Let one field submit several photos and average the result, closer to how a real composite soil sample works." },
      { t: "Downloadable reports", d: "A shareable PDF export of any analysis, for record-keeping or handing to an extension officer." },
    ],
  },
  {
    icon: Compass,
    tag: "Exploring — not committed",
    title: "Ideas worth a prototype, not yet built",
    items: [
      { t: "Plant health from leaf photos", d: "A natural extension of the same computer-vision approach — untouched so far, genuinely uncertain if it's worth building." },
      { t: "IoT soil sensor pairing", d: "Combining a photo analysis with real-time moisture and temperature readings from a cheap sensor." },
      { t: "Regional language support", d: "Hindi and other regional-language interfaces, for reach beyond English speakers." },
    ],
  },
];

export default function RoadmapPage() {
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
            <Eyebrow>Roadmap</Eyebrow>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              A starting point, told honestly.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              The heuristic model works today and is genuinely useful for a
              first read — it is not a finished product. Here&rsquo;s
              what&rsquo;s already landed, and what would actually move it
              forward next, split by how confident I am in each idea.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-16">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sprout/15 text-sprout-text">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Shipped</p>
                <h2 className="font-serif text-2xl font-semibold text-ink">Already live in the analyzer</h2>
              </div>
            </div>
            <Stagger className="mt-6 grid gap-4 sm:grid-cols-2" stagger={0.05}>
              {SHIPPED.map((item) => (
                <StaggerItem key={item.t}>
                  <div className="h-full rounded-2xl border border-sprout/25 bg-sprout/[0.04] p-5">
                    <p className="font-semibold text-ink">{item.t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.d}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>

          {GROUPS.map((g) => (
            <Reveal key={g.tag}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-forest-10 text-forest-deep">
                  <g.icon size={20} />
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">{g.tag}</p>
                  <h2 className="font-serif text-2xl font-semibold text-ink">{g.title}</h2>
                </div>
              </div>
              <Stagger className={`mt-6 grid gap-4 ${g.items.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`} stagger={0.05}>
                {g.items.map((item) => (
                  <StaggerItem key={item.t}>
                    <div className="h-full rounded-2xl border border-line bg-surface p-5">
                      <p className="font-semibold text-ink">{item.t}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.d}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal scale>
          <CTABanner
            eyebrow="Have an idea, or a use for this"
            title="Tell me what would actually be useful."
            lead="Feedback from real use beats another feature I guessed at."
            primary={{ href: "/contact", label: "Get in touch" }}
            secondary={{ href: "/analyzer", label: "Try the analyzer" }}
          />
        </Reveal>
      </section>
    </>
  );
}
