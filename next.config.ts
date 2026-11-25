import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sobesso.ru" },
      { protocol: "https", hostname: "app.sobesso.ru" },
    ],
  },
};

export default nextConfig;
