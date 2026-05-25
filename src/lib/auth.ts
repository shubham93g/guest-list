import twilio from 'twilio';

export { signJWT, verifyJWT } from './jwt';

// OTP_CHANNEL controls OTP delivery method.
// 'skip' issues a session immediately without sending or verifying a code —
// use as an operational escape hatch when OTP providers are unavailable.
// Defaults to 'skip'.
const VALID_OTP_CHANNELS = new Set<string>(['sms', 'whatsapp', 'skip']);
const rawOtpChannel = process.env.OTP_CHANNEL ?? 'skip';
if (!VALID_OTP_CHANNELS.has(rawOtpChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawOtpChannel}". Must be one of: ${[...VALID_OTP_CHANNELS].join(', ')}.`);
}
export const OTP_CHANNEL = rawOtpChannel as 'sms' | 'whatsapp' | 'skip';

// --- Client factory (serverless-safe: created per-invocation) ---

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

// --- Public API ---

export async function sendOTP(phone: string): Promise<void> {
  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: OTP_CHANNEL });
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code });
  return check.status === 'approved';
}
