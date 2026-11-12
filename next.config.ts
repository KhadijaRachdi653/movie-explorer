import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Masque le bouton « N » des outils de développement de Next.js (npm run dev)
  devIndicators: false,
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
