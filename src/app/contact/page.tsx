import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Eyebrow, CTABanner } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

const CONTACT_CARDS = [
  { icon: Mail, label: "Email", value: "satyabratmmishra@gmail.com", href: "mailto:satyabratmmishra@gmail.com" },
  { icon: GithubIcon, label: "GitHub", value: "@Enigmasatyabrat", href: "https://github.com/Enigmasatyabrat" },
  { icon: LinkedinIcon, label: "LinkedIn", value: "in/enigmasatyabrat", href: "https://www.linkedin.com/in/enigmasatyabrat" },
];

const FAQ = [
  {
    q: "Is this as accurate as a lab soil test?",
    a: "No, and it isn't trying to be. It's a heuristic model built on colour-to-property correlations from soil science literature, not a chemical assay. Treat it as a fast first read that helps you decide whether a proper lab test is worth the cost and wait — not a replacement for one.",
  },
  {
    q: "What image formats work?",
    a: "JPEG and PNG, at any reasonable size. The analysis pipeline resizes the image internally, so there's no benefit to uploading something huge.",
  },
  {
    q: "Does the live analyzer on this site upload my photo anywhere?",
    a: "Yes. The image-quality and confidence checks run in your browser first, but if the photo passes, it is uploaded to SAWA's own API, which runs the analysis and saves the result to MongoDB. The photo itself is not stored — only the analysis (soil type, colours, nutrients, crops) and basic file metadata such as its name and size.",
  },
  {
    q: "Why only 15 crops in the database?",
    a: "It started deliberately small to keep the matching logic simple and easy to verify. Expanding the crop database — including regional varieties — is on the roadmap.",
  },
  {
    q: "Can I use this for a real farming decision?",
    a: "Use it as a starting point for a conversation, not the final word. For anything with real money or a season riding on it, a proper lab test or an agricultural extension officer is still the right call.",
  },
];

export default function ContactPage() {
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
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              Let&rsquo;s talk soil, code, or both.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              The fastest ways to reach me are right below — happy to hear
              feedback on SAWA, talk through the build, or just connect.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <Stagger className="grid gap-4 sm:grid-cols-3" stagger={0.06}>
          {CONTACT_CARDS.map((c) => (
            <StaggerItem key={c.label}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:border-forest/40 hover:shadow-lg hover:shadow-forest/5"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-forest-10 text-forest-deep">
                    <c.icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{c.label}</p>
                    <p className="break-all font-mono text-xs text-ink-soft">{c.value}</p>
                  </div>
                </div>
                <ArrowUpRight size={17} className="flex-none text-ink-faint transition-colors group-hover:text-forest-deep" />
              </a>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Right now</Eyebrow>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">What I&rsquo;m open to</h2>
            <div className="mt-6 flex flex-col gap-5">
              {[
                { t: "Internships & entry-level roles", d: "Currently completing a B.Tech in Computer Science Engineering (AI & ML) at ITM GIDA, Gorakhpur." },
                { t: "Collaboration", d: "Agri-tech, computer vision, and applied ML projects in particular — SAWA is very much a starting point." },
                { t: "Feedback on SAWA", d: "Bug reports, feature ideas, or just thoughts on the approach — genuinely all welcome." },
              ].map((item) => (
                <div key={item.t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-sprout" />
                  <div>
                    <p className="font-medium text-ink">{item.t}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-line bg-bg-alt p-6">
              <Eyebrow>Quick facts</Eyebrow>
              <div className="mt-5 flex flex-col gap-3.5 font-mono text-sm">
                {[
                  ["Based in", "Gorakhpur, Uttar Pradesh, IN"],
                  ["Studying", "B.Tech CSE (AI & ML)"],
                  ["Institution", "ITM GIDA"],
                  ["This project", "React · FastAPI · MongoDB"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-line/70 pb-3 last:border-0 last:pb-0">
                    <span className="text-ink-faint">{k}</span>
                    <span className="text-ink-soft">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="border-t border-line bg-bg-alt py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal className="mb-10">
            <Eyebrow>Before you ask</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-ink">Common questions</h2>
          </Reveal>
          <div className="flex flex-col gap-4">
            {FAQ.map((f) => (
              <Reveal key={f.q}>
                <details className="group rounded-2xl border border-line bg-surface p-5 open:border-forest/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink marker:content-none">
                    {f.q}
                    <span className="flex-none font-mono text-lg text-ink-faint transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal scale>
          <CTABanner
            eyebrow="Before you go"
            title="Try the analysis yourself."
            lead="Two minutes, a soil photo, and a full breakdown — no signup."
            primary={{ href: "/analyzer", label: "Run the live analyzer" }}
          />
        </Reveal>
      </section>
    </>
  );
}
