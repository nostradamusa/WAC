import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSP is handled by middleware.ts (nonce-based strict CSP).
  // No static headers needed here.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "lprqscfivflnyutrpzdn.supabase.co",
      },
    ],
  },
};

export default nextConfig;
