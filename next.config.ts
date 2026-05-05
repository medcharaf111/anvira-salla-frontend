import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salla embeds apps in iframes inside its merchant dashboard.
  // Allow framing only from Salla domains.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.salla.sa https://*.salla.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
