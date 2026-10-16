import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const backend = backendUrl ? new URL(backendUrl) : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: backend ? [{ protocol: backend.protocol.replace(":", "") as "http" | "https", hostname: backend.hostname, port: backend.port, pathname: "/uploads/**" }] : [],
  },
  async rewrites() {
    if (!backendUrl) return [];
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    if (!backendUrl) return [];
    return [{ source: "/admin/:path*", destination: `${backendUrl}/admin/:path*`, permanent: false }];
  },
};

export default nextConfig;
