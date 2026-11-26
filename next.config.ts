import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sobesso.ru" },
      { protocol: "https", hostname: "app.sobesso.ru" },
    ],
  },
};

export default withNextIntl(nextConfig);
