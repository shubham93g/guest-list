import type { NextConfig } from 'next';
import { CDN_BASE } from './src/lib/cdn';

const isProd = process.env.NODE_ENV === 'production';

// CSP value for production. Not applied in development because Next.js dev mode
// uses eval() for webpack HMR/source-maps, which is blocked by script-src
// without 'unsafe-eval'. Tailwind and Next.js inline styles require 'unsafe-inline'.
// Hero videos are served from a public Vercel Blob store (see src/lib/cdn.ts),
// so its origin must be allowed in media-src. hero.jpg stays in public/, so
// img-src needs no extra origin.
const CSP_VALUE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `media-src 'self' ${CDN_BASE}`,
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    const baseHeaders = [
      // Prevent MIME-type sniffing.
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Deny framing to block clickjacking.
      { key: 'X-Frame-Options', value: 'DENY' },
      // Restrict referrer information sent to third parties.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Enforce HTTPS for 1 year; include subdomains.
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ];

    if (isProd) {
      baseHeaders.push({ key: 'Content-Security-Policy', value: CSP_VALUE });
    }

    return [{ source: '/(.*)', headers: baseHeaders }];
  },
};

export default nextConfig;
