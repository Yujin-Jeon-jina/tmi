import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer 관련 패키지를 번들링에서 제외
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
