import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict-mode double-mounting creates/destroys WebGL contexts back to back,
  // which crashes the postprocessing EffectComposer in the launch intro.
  reactStrictMode: false,
};

export default nextConfig;
