// The stack the live app actually runs on (the Python research code lives in ml/).
const ITEMS = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "MongoDB Atlas",
  "Vercel",
  "K-Means Clustering",
  "sharp",
  "Python for the ML research",
];

export default function Marquee() {
  const list = [...ITEMS, ...ITEMS];
  return (
    <div
      className="overflow-hidden border-y border-line py-5"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="flex w-max animate-marquee gap-14">
        {list.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 whitespace-nowrap font-mono text-sm text-ink-soft"
          >
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-soil" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
