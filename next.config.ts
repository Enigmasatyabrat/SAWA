import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "export"` was removed to enable server-side API routes
  // (Route Handlers) and MongoDB access at request time. The app is now a
  // full-stack Next.js app and must be hosted on a Node server / Vercel,
  // not served as pure static files.
  images: {
    // Kept `unoptimized` so next/image works without a runtime image
    // optimizer (no `sharp` requirement) after leaving static-export mode.
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
