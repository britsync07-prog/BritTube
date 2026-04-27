import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Strip trailing /api/v1 if present in NEXT_PUBLIC_API_URL to avoid double-prefixing
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090").replace(/\/api\/v1\/?$/, "");
    
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/tasks/:path*",
        destination: `${backendUrl}/tasks/:path*`,
      },
    ];
  },
};

export default nextConfig;
