import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.microlink.io' },
    ],
    qualities: [50, 75],
  },
};

export default nextConfig;
