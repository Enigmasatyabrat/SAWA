/** Canonical site origin. Override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sawa-soil-analyzer-silk.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "SAWA";

/** Public, indexable routes (API routes are excluded). */
export const ROUTES = ["/", "/analyzer", "/technology", "/roadmap", "/about", "/contact"] as const;
