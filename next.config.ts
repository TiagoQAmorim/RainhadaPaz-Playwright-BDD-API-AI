import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: permitir preview via Cloudflare quick tunnel / localtunnel (JS em /_next/*).
  allowedDevOrigins: ["*.trycloudflare.com", "*.loca.lt"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    // Conteúdo paroquial local; Vatican News RSS usa domínio vaticannews.va.
    remotePatterns: [
      { protocol: "https", hostname: "www.vaticannews.va", pathname: "/**" },
      { protocol: "https", hostname: "**.vaticannews.va", pathname: "/**" },
    ],
  },
  async rewrites() {
    return {
      afterFiles: [
        { source: "/uploads/:path*", destination: "/api/stored-uploads/:path*" },
      ],
    };
  },
};

export default nextConfig;
