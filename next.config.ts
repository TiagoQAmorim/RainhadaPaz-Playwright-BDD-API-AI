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
    // Conteúdo paroquial: apenas caminhos locais. RSS do Vaticano usa img sem otimização remota.
    remotePatterns: [],
  },
};

export default nextConfig;
