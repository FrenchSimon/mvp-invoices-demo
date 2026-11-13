import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Polices du PDF des factures, lues sur le disque par la route /invoices/[id]/pdf.
  outputFileTracingIncludes: {
    "/invoices/[id]/pdf": ["./src/lib/pdf/fonts/*.woff"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
