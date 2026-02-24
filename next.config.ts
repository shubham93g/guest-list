import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// CSP value for production. Not applied in development because Next.js dev mode
// uses eval() for webpack HMR/source-maps, which is blocked by script-src
// without 'unsafe-eval'. Tailwind and Next.js inline styles require 'unsafe-inline'.
const CSP_VALUE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.pexels.com",
  "font-src 'self'",
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
