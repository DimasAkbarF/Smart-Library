import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/librarian", destination: "/admin", permanent: false },
      { source: "/librarian/borrow", destination: "/admin/borrow", permanent: false },
      { source: "/librarian/return", destination: "/admin/return", permanent: false },
      { source: "/librarian/transactions", destination: "/admin/transactions", permanent: false },
      { source: "/librarian/books", destination: "/admin/books", permanent: false },
      { source: "/librarian/reports", destination: "/admin/reports", permanent: false },
      { source: "/librarian/:path*", destination: "/admin/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
