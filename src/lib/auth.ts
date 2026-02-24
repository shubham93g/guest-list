import twilio from 'twilio';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

export { signJWT, verifyJWT } from './jwt';

// RSVP_CHANNEL controls login UI and identifier type (phone or email).
// Defaults to 'phone' — guests enter a phone number.
const VALID_RSVP_CHANNELS = new Set<string>(['phone', 'email']);
const rawRsvpChannel = process.env.RSVP_CHANNEL ?? 'phone';
if (!VALID_RSVP_CHANNELS.has(rawRsvpChannel)) {
  throw new Error(`Invalid RSVP_CHANNEL: "${rawRsvpChannel}". Must be one of: ${[...VALID_RSVP_CHANNELS].join(', ')}.`);
}
export const RSVP_CHANNEL = rawRsvpChannel as 'phone' | 'email';

// OTP_CHANNEL controls OTP delivery method.
// 'skip' issues a session immediately without sending or verifying a code —
// use as an operational escape hatch when OTP providers are unavailable.
// Defaults to 'skip'.
const VALID_OTP_CHANNELS = new Set<string>(['sms', 'whatsapp', 'email', 'skip']);
const rawOtpChannel = process.env.OTP_CHANNEL ?? 'skip';
if (!VALID_OTP_CHANNELS.has(rawOtpChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawOtpChannel}". Must be one of: ${[...VALID_OTP_CHANNELS].join(', ')}.`);
}
export const OTP_CHANNEL = rawOtpChannel as 'sms' | 'whatsapp' | 'email' | 'skip';

// Validate that RSVP_CHANNEL and OTP_CHANNEL are a compatible combination.
// phone identifiers can only pair with sms/whatsapp/skip OTP delivery.
// email identifiers can only pair with email/skip OTP delivery.
const VALID_COMBINATIONS: Record<string, Set<string>> = {
  phone: new Set(['sms', 'whatsapp', 'skip']),
  email: new Set(['email', 'skip']),
};
if (!VALID_COMBINATIONS[RSVP_CHANNEL].has(OTP_CHANNEL)) {
  throw new Error(
    `Invalid channel combination: RSVP_CHANNEL="${RSVP_CHANNEL}" is incompatible with OTP_CHANNEL="${OTP_CHANNEL}". ` +
    `For RSVP_CHANNEL=phone use OTP_CHANNEL=sms, whatsapp, or skip. ` +
    `For RSVP_CHANNEL=email use OTP_CHANNEL=email or skip.`
  );
}

// --- Stateless email OTP (HMAC-based, no server-side storage) ---
//
// The code is derived from JWT_SECRET + email + time window so it can be verified
// by any route handler or serverless instance without sharing state.
//
// Window = 10 minutes. On verify we accept the current window AND the previous
// one to handle requests that straddle a window boundary.

const EMAIL_OTP_WINDOW_MS = 10 * 60 * 1_000;

function emailOTPWindow(): number {
  return Math.floor(Date.now() / EMAIL_OTP_WINDOW_MS);
}

function deriveEmailOTP(email: string, window: number): string {
  const secret = process.env.JWT_SECRET ?? '';
  const hmac = createHmac('sha256', secret).update(`${email}:${window}`).digest('hex');
  // Map 8 hex chars → 0–4294967295, then scale to 100000–999999 (6 digits).
  const num = parseInt(hmac.slice(0, 8), 16);
  return String(100_000 + (num % 900_000));
}

function generateEmailCode(email: string): string {
  return deriveEmailOTP(email, emailOTPWindow());
}

function verifyEmailCode(email: string, code: string): boolean {
  const w = emailOTPWindow();
  // Accept current window and previous window.
  return deriveEmailOTP(email, w) === code || deriveEmailOTP(email, w - 1) === code;
}

// --- Client factories (serverless-safe: created per-invocation) ---

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// --- Public API ---

export async function sendOTP(identifier: string): Promise<void> {
  if (OTP_CHANNEL === 'email') {
    const code = generateEmailCode(identifier);
    const resend = getResendClient();
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: identifier,
      subject: 'Your invitation code',
      text: `Your code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    return;
  }

  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: identifier, channel: OTP_CHANNEL });
}

export async function verifyOTP(identifier: string, code: string): Promise<boolean> {
  if (OTP_CHANNEL === 'email') {
    return verifyEmailCode(identifier, code);
  }

  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: identifier, code });
  return check.status === 'approved';
}
