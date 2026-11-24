import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: permitir preview via Cloudflare quick tunnel / localtunnel (JS em /_next/*).
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com", "*.loca.lt"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // O middleware lê o corpo do pedido. Sem este limite, uma foto grande é cortada e o salvamento falha.
    proxyClientMaxBodySize: "12mb",
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
