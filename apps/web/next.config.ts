import type { NextConfig } from "next";

const basePath = "/it-asset";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
