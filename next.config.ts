import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // instrumentationHook is removed here as it might be enabled by default
    // or handled differently in the current Next.js version (e.g. Next.js 15+)
  },
};

export default nextConfig;
