import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "./Navbar";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import { PHOTOS, type SitePhoto } from "@/lib/photos";

const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/technology", label: "Technology" },
  { href: "/analyzer", label: "Analyzer" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-bg-alt">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              A photograph in, a soil type, nutrient estimate, and crop
              shortlist out. Built as a B.Tech CSE (AI &amp; ML) mini project
              at ITM GIDA, Gorakhpur.
            </p>
            <Link
              href="/analyzer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Try the live analyzer
            </Link>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">
              Site
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {SITE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-soft transition-colors hover:text-forest-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">
              Connect
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href="mailto:satyabratmmishra@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-forest-deep"
                >
                  <Mail size={14} /> Email
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Enigmasatyabrat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-forest-deep"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/enigmasatyabrat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-forest-deep"
                >
                  <LinkedinIcon size={14} /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SAWA — Soil Analysis Web App. Designed &amp; engineered by Satyabrat Mishra.</p>
        </div>

        <p className="mt-6 max-w-4xl text-sm leading-relaxed text-ink-soft">
          Photographs:{" "}
          {(Object.values(PHOTOS) as SitePhoto[]).map((p, i, all) => (
            <span key={p.src}>
              <a href={p.source} className="underline underline-offset-2 hover:text-forest-deep" target="_blank" rel="noopener noreferrer">
                {p.title}
              </a>
              {p.author ? ` by ${p.author}` : ""},{" "}
              <a href={p.licenceUrl} className="underline underline-offset-2 hover:text-forest-deep" target="_blank" rel="noopener noreferrer">
                {p.licence}
              </a>
              {i < all.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
