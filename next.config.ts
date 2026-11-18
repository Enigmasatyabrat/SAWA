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
  // sharp loads libvips (a .so) through a native rpath that file tracing cannot
  // follow, so on Vercel the analyze-soil function shipped without it and every
  // request failed with "libvips-cpp.so.8.18.3: cannot open shared object file".
  // Ship the Linux binaries with that function explicitly.
  outputFileTracingIncludes: {
    "/api/analyze-soil": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
};

export default nextConfig;
