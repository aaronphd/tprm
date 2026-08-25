import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (bundled server +
  // only the node_modules it actually needs) for a minimal Docker image.
  output: "standalone",
};

export default nextConfig;
