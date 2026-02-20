# TODO

## Code Review Fixes

### Should Fix (before real guests)

- [ ] **Rate limiting on `send-otp`** — `src/app/api/auth/send-otp/route.ts`
  Prevent endpoint spam that burns Twilio credits. Options: Vercel rate limiting,
  or a simple IP-based check middleware.

- [ ] **Cache guest list to reduce Sheets reads** — `src/lib/sheets.ts`
  `findGuestByPhone` fetches all rows on every call. Cache the guest list in
  memory (or via Next.js `unstable_cache`) with a short TTL (e.g. 5 min) so
  repeated OTP attempts and page loads don't hammer the Sheets API.
  Invalidate on `updateGuestRSVP` to avoid serving stale RSVP status.


- [ ] **Redirect already-RSVPed guests** — `src/app/welcome/page.tsx`
  If a guest's `rsvpStatus` is `attending` or `declined`, redirect them to
  a dedicated confirmation page (e.g. `/rsvp-confirmed`) instead of showing
  the RSVP form again. The confirmation page should show their submitted
  status and a thank-you message.

---

## Tests to Write

### Unit Tests

- [ ] **`src/lib/jwt.ts`**
  - `signJWT` returns a non-empty string
  - `verifyJWT` returns correct payload for a valid token
  - `verifyJWT` returns `null` for an expired token
  - `verifyJWT` returns `null` for a tampered token
  - `verifyJWT` returns `null` for a garbage string
  - `getJWTSecret` throws if `JWT_SECRET` env var is missing

- [ ] **`src/lib/event.ts`**
  - `getEventDetails` returns values from env vars
  - `getEventDetails` returns empty strings when env vars are unset

### API Route Tests

- [ ] **`POST /api/auth/send-otp`**
  - Returns 400 for missing phone
  - Returns 400 for invalid phone format (no `+`, too short)
  - Returns 404 when phone not in guest list
  - Returns 200 when phone found and OTP sent

- [ ] **`POST /api/auth/verify-otp`**
  - Returns 400 for missing phone or code
  - Returns 400 for incorrect OTP
  - Returns 200 + sets `httpOnly` session cookie for correct OTP

- [ ] **`POST /api/rsvp/submit`**
  - Returns 401 with no session cookie
  - Returns 401 with invalid/expired JWT
  - Returns 400 for missing `status` field
  - Returns 400 for invalid `status` value (not `attending`/`declined`)
  - Returns 200 with valid session + valid body

### Integration / E2E Tests

- [ ] Full happy path: phone entry → OTP → session cookie → RSVP submit → success
- [ ] Middleware: `/welcome` redirects to `/verify` with no cookie
- [ ] Middleware: `/welcome` allows through with valid JWT cookie
- [ ] Middleware: `/verify` redirects to `/welcome` with a valid session cookie
- [ ] Middleware: `/verify` shows the form with no cookie
- [ ] RSVP form: previously submitted RSVP pre-fills form fields
