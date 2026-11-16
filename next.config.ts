import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Polices du PDF des factures, lues sur le disque par la route /invoices/[id]/pdf.
  outputFileTracingIncludes: {
    "/invoices/[id]/pdf": ["./src/lib/pdf/fonts/*.woff"],
  },
  // En-têtes de sécurité sur toutes les pages (audit du 2026-11-16) :
  // le site ne s'affiche pas dans le cadre d'un autre site (clickjacking), le navigateur
  // ne devine pas le type des fichiers, l'adresse complète n'est pas transmise aux
  // sites externes, et caméra, micro et position sont désactivés.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
