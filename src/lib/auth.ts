import twilio from 'twilio';

export { signJWT, verifyJWT } from './jwt';

const MOCK_OTP = process.env.MOCK_OTP === 'true';

// Switch between 'sms' and 'whatsapp' via OTP_CHANNEL in .env.local.
// Defaults to 'sms' — no WhatsApp Business Account setup required.
// Exported so page.tsx can derive UI copy from the same value without a second env read.
const VALID_CHANNELS = new Set<string>(['sms', 'whatsapp']);
const rawChannel = process.env.OTP_CHANNEL ?? 'sms';
if (!VALID_CHANNELS.has(rawChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawChannel}". Must be one of: ${[...VALID_CHANNELS].join(', ')}.`);
}
export const OTP_CHANNEL = rawChannel as 'sms' | 'whatsapp';

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function sendOTP(phone: string): Promise<{ mock: boolean }> {
  if (MOCK_OTP) {
    return { mock: true };
  }
  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: OTP_CHANNEL });
  return { mock: false };
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  if (MOCK_OTP) {
    return true;
  }
  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code });
  return check.status === 'approved';
}
