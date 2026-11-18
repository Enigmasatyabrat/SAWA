import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-base font-medium text-forest-deep">{children}</span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-[1.1] text-ink sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{lead}</p>}
    </div>
  );
}

export function StatCard({
  value,
  label,
  compare,
}: {
  value: string;
  label: string;
  compare?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-6">
      <p className="font-serif text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-base font-medium text-ink">{label}</p>
      {compare && <p className="mt-1 text-sm text-ink-soft">{compare}</p>}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const Comp: React.ElementType = external ? "a" : Link;
  const extraProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Comp
      href={href}
      {...extraProps}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${className}`}
    >
      {children}
      <ArrowUpRight size={16} />
    </Comp>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const Comp: React.ElementType = external ? "a" : Link;
  const extraProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Comp
      href={href}
      {...extraProps}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-base font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${className}`}
    >
      {children}
    </Comp>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1 font-mono text-xs text-ink-soft">
      {children}
    </span>
  );
}

export function CTABanner({
  eyebrow,
  title,
  lead,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-forest px-6 py-16 text-center sm:px-16 sm:py-20">
      <div className="relative mx-auto max-w-2xl">
        <span className="text-base font-medium text-white/80">{eyebrow}</span>
        <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/75">{lead}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primary.href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-forest-deep transition-transform hover:-translate-y-0.5"
          >
            {primary.label}
            <ArrowUpRight size={16} />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
