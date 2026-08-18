import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, StatCard, CTABanner } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

const JOURNEY = [
  {
    n: "01",
    title: "Why a photograph, not a lab",
    body: "Government soil-testing labs charge roughly ₹500–800 per sample; private labs run ₹1,000–2,000. Add transport and a lost work day, and one test can cost ₹1,000–3,000 before the 7–14 days it takes to get results back. For the small and marginal farmers who make up the large majority of India's farming community, that combination of cost, distance, and delay makes regular soil monitoring impractical — even though soil colour has been used as a proxy for composition since the Munsell Soil Color Chart standardised the practice in 1905.",
  },
  {
    n: "02",
    title: "Building the pipeline",
    body: "React and Tailwind on the front end, FastAPI and MongoDB behind it. scikit-learn's K-Means algorithm does the actual seeing — clustering an image into five dominant colours that a rule-based classifier turns into a soil type, and a heuristic model turns into a pH and N-P-K estimate.",
  },
  {
    n: "03",
    title: "Testing it properly",
    body: "Every backend endpoint — upload, extraction, classification, history — ran through an automated test suite before being called done: ten out of ten passed. The frontend was checked on both a 1920×1080 desktop viewport and a 390×844 mobile one.",
  },
  {
    n: "04",
    title: "Deployment, the hard way",
    body: "The first attempt to put this online fought the deployment platform's default Python runtime the entire way. Builds that worked perfectly on a local machine didn't reproduce in the cloud.",
  },
  {
    n: "05",
    title: "Containerizing",
    body: "The fix was to stop negotiating with the platform. A Dockerfile now pins the exact runtime the app expects, so a build behaves the same on a laptop as it does anywhere else.",
  },
  {
    n: "06",
    title: "Where it goes next",
    body: "The heuristic nutrient model is a starting point, not a finish line. Lab-verified soil samples, a trained model in place of the current colour rules, and field testing beyond one sample image are the obvious next steps — see the Roadmap for the full list.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-14 sm:pt-20">
        <Reveal>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-forest-deep"
          >
            <ArrowLeft size={14} /> Back home
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-6 max-w-2xl">
            <Eyebrow>About &middot; The story</Eyebrow>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              One developer, one problem worth solving.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              SAWA is a solo mini-project built to find out whether a
              photograph and some applied colour science could stand in for
              a first soil test.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <Reveal>
          <p className="text-balance font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl">
            This started as a way to put a Computer Science and AI/ML degree
            to work on something outside a textbook. It stayed a soil
            project because the problem is real —{" "}
            <span className="text-forest-deep">
              someone deciding what to plant shouldn&rsquo;t need a lab
              appointment and a two-week wait to get a first answer.
            </span>
          </p>
        </Reveal>
      </section>

      <section className="border-y border-line bg-bg-alt py-14">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard value="1" label="Developer" compare="Built solo, front end to database" />
              <StatCard value="3" label="Tier architecture" compare="React · FastAPI · MongoDB" />
              <StatCard value="10/10" label="Backend tests passing" compare="automated suite" />
              <StatCard value="2" label="Platforms tried" compare="before Docker stuck the landing" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= JOURNEY ================= */}
      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <Reveal>
          <Eyebrow>How it came together</Eyebrow>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            The journey, honestly told.
          </h2>
        </Reveal>

        <div className="relative mt-14">
          <div className="absolute bottom-2 left-[21px] top-2 w-px bg-line-strong" aria-hidden />
          <div className="flex flex-col gap-12">
            {JOURNEY.map((item) => (
              <Reveal key={item.n} className="relative pl-16">
                <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-sm text-forest-deep">
                  {item.n}
                </span>
                <h3 className="font-serif text-xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GUIDANCE ================= */}
      <section className="border-t border-line bg-bg-alt py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-xl">
            <Eyebrow>Academic home</Eyebrow>
            <h2 className="mt-4 text-balance font-serif text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              Built under guidance, at ITM GIDA.
            </h2>
          </Reveal>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
            <StaggerItem>
              <div className="h-full rounded-2xl border border-line bg-surface p-6">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Guide</p>
                <p className="mt-2 font-serif text-lg font-semibold text-ink">Dr. Ashutosh Kumar Rao</p>
                <p className="mt-1 text-sm text-ink-soft">Assistant Professor, CSE</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="h-full rounded-2xl border border-line bg-surface p-6">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Guide</p>
                <p className="mt-2 font-serif text-lg font-semibold text-ink">Dr. Shubham Srivastava</p>
                <p className="mt-1 text-sm text-ink-soft">Assistant Professor, CSE</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="h-full rounded-2xl border border-line bg-surface p-6">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Institution</p>
                <p className="mt-2 font-serif text-lg font-semibold text-ink">ITM GIDA, Gorakhpur</p>
                <p className="mt-1 text-sm text-ink-soft">Dept. of Computer Science &amp; Engineering</p>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ================= CREATOR ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="mb-10">
          <Eyebrow>Behind SAWA</Eyebrow>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            The creator
          </h2>
        </Reveal>
        <Reveal>
          <div className="flex flex-col items-start gap-8 rounded-3xl border border-line bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
            <div
              className="flex h-28 w-28 flex-none items-center justify-center rounded-full font-serif text-3xl font-semibold text-white"
              style={{
                background:
                  "conic-gradient(from 220deg, #9c6b3e, #6fa05c, #2f4b33, #d9c29b, #9c6b3e)",
              }}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-surface text-ink" style={{ margin: 4, width: "calc(100% - 8px)", height: "calc(100% - 8px)" }}>
                SM
              </span>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-semibold text-ink">Satyabrat Mishra</h3>
              <p className="mt-1 font-mono text-sm text-forest-deep">Creator &amp; Full-Stack Developer</p>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                B.Tech in Computer Science Engineering (AI &amp; ML) at ITM
                GIDA, Gorakhpur. Built SAWA end to end — the interface, the
                API, the K-Means colour pipeline, and the crop-matching
                logic — as a mini project exploring what applied computer
                vision can do for agriculture.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="https://github.com/Enigmasatyabrat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-forest"
                >
                  <GithubIcon size={15} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/enigmasatyabrat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-forest"
                >
                  <LinkedinIcon size={15} /> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal scale>
          <CTABanner
            eyebrow="Curious how it actually works"
            title="Walk through the pipeline in detail."
            lead="Every stage from upload to crop recommendation, with the architecture behind it."
            primary={{ href: "/technology", label: "Explore the technology" }}
            secondary={{ href: "/contact", label: "Get in touch" }}
          />
        </Reveal>
      </section>
    </>
  );
}
