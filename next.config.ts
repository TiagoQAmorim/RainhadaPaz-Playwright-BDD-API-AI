import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "paroquiarainhadapaz.com.br",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "www.vaticannews.va",
        pathname: "/content/**",
      },
    ],
  },
};

export default nextConfig;
