import twilio from 'twilio';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

export { signJWT, verifyJWT } from './jwt';

const MOCK_OTP = process.env.MOCK_OTP === 'true';

// Switch between 'sms', 'whatsapp', and 'email' via OTP_CHANNEL in .env.local.
// Defaults to 'sms' — no WhatsApp Business Account or email setup required.
// Exported so page.tsx can derive UI copy from the same value without a second env read.
const VALID_CHANNELS = new Set<string>(['sms', 'whatsapp', 'email']);
const rawChannel = process.env.OTP_CHANNEL ?? 'sms';
if (!VALID_CHANNELS.has(rawChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawChannel}". Must be one of: ${[...VALID_CHANNELS].join(', ')}.`);
}
export const OTP_CHANNEL = rawChannel as 'sms' | 'whatsapp' | 'email';

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

export async function sendOTP(identifier: string): Promise<{ mock: boolean }> {
  if (MOCK_OTP) {
    return { mock: true };
  }

  if (OTP_CHANNEL === 'email') {
    const code = generateEmailCode(identifier);
    const resend = getResendClient();
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: identifier,
      subject: 'Your invitation code',
      text: `Your code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    return { mock: false };
  }

  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: identifier, channel: OTP_CHANNEL });
  return { mock: false };
}

export async function verifyOTP(identifier: string, code: string): Promise<boolean> {
  if (MOCK_OTP) {
    return true;
  }

  if (OTP_CHANNEL === 'email') {
    return verifyEmailCode(identifier, code);
  }

  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: identifier, code });
  return check.status === 'approved';
}
