import LoginPage from '@/components/login/LoginPage';
import { RSVP_CHANNEL, OTP_CHANNEL } from '@/lib/auth';

export default function Page() {
  return <LoginPage rsvpChannel={RSVP_CHANNEL} otpChannel={OTP_CHANNEL} />;
}
