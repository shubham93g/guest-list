# guest-list

A private wedding website with OTP-gated RSVP, personalized guest invitations, and Google Sheets as the data store.

## Features

- Public save-the-date landing page — looping hero video, venue details, and FAQ
- Personalized `/invite` page, unlocked per guest via OTP auth
- RSVP form with dietary notes, plus-one, and a message field; returning guests see their prior response
- Multi-channel OTP: SMS or WhatsApp — configurable per deployment without code changes
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
| jose | JWT sessions | Edge-compatible (no Node.js-only APIs); required for use in middleware |
| Zod | Input validation | All API request bodies validated at the boundary |
| Vercel | Hosting + CI | Native GitHub integration; preview URLs per PR |

## Architecture

Three public-facing routes: `/` (landing), `/login` (phone + OTP entry), and `/invite` (personalized RSVP). Auth routing is handled in Edge middleware — a valid JWT redirects away from `/login`, a missing JWT redirects away from `/invite` — keeping route handlers clean.

The Google Sheets client uses a factory pattern (one auth client per invocation) for serverless safety. A 5-minute in-memory cache sits in front of Sheets reads and is invalidated on every RSVP write, avoiding per-request API calls without introducing a caching layer. Three API routes handle auth and RSVP submission; event details (couple names, date, venue) live in `src/config/wedding.ts` as static config — not in the Sheet.

## Auth and OTP

Guests log in with their phone number. OTP delivery is controlled by `OTP_CHANNEL`:

| `OTP_CHANNEL` | Delivery | Notes |
|---|---|---|
| `sms` | Twilio Verify | Default for live deployments |
| `whatsapp` | Twilio Verify (WhatsApp) | Requires Meta-approved WhatsApp Business Account |
| `skip` | None | Valid first-class mode — see below |

**`OTP_CHANNEL=skip`** issues a session immediately after the allowlist check passes — no code is sent or verified. Guests not on the list still get a 422. Useful for trusted guest lists or as an operational fallback if the OTP provider goes down (toggle in Vercel env vars, redeploy, revert when the provider recovers — no code changes).

## Security

- **Rate limiting**: in-memory sliding window; per-IP on `login-id` (10/15 min), per-identifier on `login-otp` (5/10 min), per-IP on RSVP submit (10/15 min)
- **Anti-enumeration**: `login-id` and `login-otp` return identical error messages for format validation failures and not-found errors
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
- `OTP_CHANNEL` defaults to `skip` — set to `sms` or `whatsapp` for live OTP delivery

## Customising

| What | Where |
|---|---|
| Wedding details (names, date, venue) | `src/config/wedding.ts` |
| FAQ content | `faqs` array in `src/components/landing/FAQSection.tsx` |
| Hero video | `public/hero.mp4` — replace the file to swap the video |
| Venue background photo | URL at the top of `src/components/landing/ScrollBackground.tsx` |

**Hero video format:** the file must be H.265 (HEVC) MP4, scaled to 1920px wide. Convert with:

```bash
ffmpeg -i input.mov \
  -vcodec libx265 -an \
  -tag:v hvc1 \
  -vf scale=1920:-2 \
  -crf 28 \
  public/hero.mp4
```

`-crf 28` is a good quality/size trade-off for a background video (lower = better quality, larger file). `-vf scale=1920:-2` caps width at 1920px while preserving the source aspect ratio. `-tag:v hvc1` is required for Safari/iOS compatibility. The file is served with `Cache-Control: immutable` so repeat visitors play from the browser cache instantly. Firefox has no H.265 support and falls back to the static `hero.jpg` background gracefully.

## Commands

```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint (runs eslint src/)
```
