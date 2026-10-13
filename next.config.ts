import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.supabase.co http://localhost:54321 http://127.0.0.1:54321;
  frame-src 'self';
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
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
    value: "DENY",
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
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
      { source: "/admin/login", destination: "/login", permanent: true },
      { source: "/student/books", destination: "/books", permanent: true },
      { source: "/student/books/:id", destination: "/books/:id", permanent: true },
      { source: "/student", destination: "/login", permanent: true },
      { source: "/student/:path*", destination: "/login", permanent: true },
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
