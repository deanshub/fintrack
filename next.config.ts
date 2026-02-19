import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  turbopack: {
    resolveAlias: {
      "tw-animate-css": "tw-animate-css/dist/tw-animate.css",
    },
  },
  webpack: (config) => {
    config.resolve.alias["tw-animate-css"] = "tw-animate-css/dist/tw-animate.css";
    return config;
  },
};

export default withSerwist(nextConfig);
