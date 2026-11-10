import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/analyzer" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/analyzer" ? 0.9 : 0.6,
  }));
}
