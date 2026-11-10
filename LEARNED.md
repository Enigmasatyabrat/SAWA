| Term | What it is | Where used | Date |
|---|---|---|---|
| Metadata files (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) | Next.js turns these special files in `app/` into /sitemap.xml, /robots.txt and the social preview image at build time | src/app/ | 2026-11-11 |
| `metadataBase` + `title.template` | One base URL makes every relative canonical/OG URL absolute; the template gives each page "Page \| SAWA" titles automatically | src/app/layout.tsx | 2026-11-11 |
| JSON-LD structured data | A `<script type="application/ld+json">` describing the site (here a free WebApplication) so search engines can show richer results | src/app/layout.tsx | 2026-11-11 |
