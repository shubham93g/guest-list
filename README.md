# guest-list

A private wedding website with OTP-gated RSVP, personalized guest invitations, and Google Sheets as the data store.

## Features

- Public save-the-date landing page — hero, venue details, and FAQ
- Personalized `/invite` page, unlocked per guest via OTP auth
- RSVP form with dietary notes, plus-one, and a message field; returning guests see their prior response
- Multi-channel OTP: SMS, WhatsApp, or email — configurable per deployment without code changes
- iCal export so guests can add the event to their calendar
- Guest data lives in Google Sheets — admin-accessible without a separate dashboard

## Stack

| Technology | Role | Notable detail |
|---|---|---|
| Next.js 15 (App Router) | Full-stack framework | Server Components for per-guest personalization; Edge-compatible middleware for auth routing |
| TypeScript | Type safety | Strict mode; branded types for domain values (e.g. `ISOTimestamp`) |
| Tailwind CSS + shadcn/ui | Styling and components | — |
| Google Sheets | Guest data store | Keeps data admin-accessible; avoids standing up a database for a single-event app |
| Twilio Verify | SMS / WhatsApp OTP | Managed OTP delivery with no token storage required |
| Resend | Email OTP | Stateless HMAC codes — no database or Redis required |
| jose | JWT sessions | Edge-compatible (no Node.js-only APIs); required for use in middleware |
| Zod | Input validation | All API request bodies validated at the boundary |
| Vercel | Hosting + CI | Native GitHub integration; preview URLs per PR |

## Architecture

Three public-facing routes: `/` (landing), `/login` (identifier + OTP entry), and `/invite` (personalized RSVP). Auth routing is handled in Edge middleware — a valid JWT redirects away from `/login`, a missing JWT redirects away from `/invite` — keeping route handlers clean.

The Google Sheets client uses a factory pattern (one auth client per invocation) for serverless safety. A 5-minute in-memory cache sits in front of Sheets reads and is invalidated on every RSVP write, avoiding per-request API calls without introducing a caching layer. Three API routes handle auth and RSVP submission; event details (couple names, date, venue) live in `src/config/wedding.ts` as static config — not in the Sheet.

## Auth and OTP

Login identifier is controlled by `RSVP_CHANNEL` (`phone` or `email`). OTP delivery is controlled independently by `OTP_CHANNEL`:

| `OTP_CHANNEL` | Delivery | Notes |
|---|---|---|
| `sms` | Twilio Verify | Requires `RSVP_CHANNEL=phone` |
| `whatsapp` | Twilio Verify (WhatsApp) | Requires Meta-approved WhatsApp Business Account |
| `email` | Resend | Requires `RSVP_CHANNEL=email` |
| `skip` | None | Valid first-class mode — see below |

Channel combinations are validated at startup so misconfiguration fails immediately rather than at request time.

**Email OTP is stateless.** Codes are HMAC-derived from `JWT_SECRET + identifier + a 10-minute time window` — no token storage, no Redis, no cleanup job.

**`OTP_CHANNEL=skip`** issues a session immediately after the allowlist check passes — no code is sent or verified. Guests not on the list still get a 422. Useful for trusted guest lists or as an operational fallback if the OTP provider goes down (toggle in Vercel env vars, redeploy, revert when the provider recovers — no code changes).

## Security

- **Rate limiting**: in-memory sliding window; per-IP on `send-otp` (10/15 min), per-identifier on `login-otp` (5/10 min), per-IP on RSVP submit (10/15 min)
- **Anti-enumeration**: `send-otp` and `login-otp` return identical error messages for format validation failures and not-found errors
- **HTTP security headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `HSTS` applied to all routes via `next.config.ts`
- **CSP** (production only): allowlisted `script-src`, `style-src`, `img-src`, `connect-src`; `frame-ancestors 'none'`
- **Sessions**: `httpOnly` JWT cookie, 30-day expiry, `Secure` flag in production
- **API responses**: `login-otp` returns only `{ success: true }`; guest data is read server-side from the JWT — nothing is echoed to the client

## Deployment and CI

Hosted on Vercel (Hobby plan). No `vercel.json` needed — Next.js is detected automatically. GitHub integration handles CI: every push to `main` deploys to production, every PR gets a preview URL. Lint errors surface as failed deployments. Environment variables are configured in the Vercel dashboard.

## Setup

```bash
npm install
cp .env.example .env.local  # fill in credentials
npm run dev                  # http://localhost:3000
```

All required variables are documented in `.env.example`. Key notes:
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `OTP_CHANNEL` and `RSVP_CHANNEL` must be a valid combination (see table above); the app throws at startup otherwise

## Customising

| What | Where |
|---|---|
| Wedding details (names, date, venue) | `src/config/wedding.ts` |
| FAQ content | `faqs` array in `src/components/landing/FAQSection.tsx` |
| Background photos | URLs at the top of `src/components/landing/ScrollBackground.tsx` |

If background photos are loaded from an external host, add that hostname to the `img-src` directive in `next.config.ts`.

## Commands

```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint (runs eslint src/)
```
