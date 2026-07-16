import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller Docker image via `node server.js` (see deploy/Dockerfile).
  output: "standalone",
  // Pin the workspace root (multiple lockfiles exist higher up the tree).
  turbopack: { root: __dirname },
  async redirects() {
    return [
      // Legacy URL — the cross-border course page moved under /program.
      {
        source: "/cross-border",
        destination: "/program/ecommerce",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
