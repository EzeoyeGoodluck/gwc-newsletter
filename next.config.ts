import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "3mb" },
  },
};
export default nextConfig;
