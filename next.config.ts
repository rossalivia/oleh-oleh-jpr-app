import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Verifikasi tipe TypeScript dilakukan secara ketat melalui `tsc --noEmit` untuk menghindari OOM worker pada Windows
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
