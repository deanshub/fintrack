import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
