import LoginPage from '@/components/login/LoginPage';
import { OTP_CHANNEL } from '@/lib/auth';

export default function Page() {
  return <LoginPage channel={OTP_CHANNEL} />;
}
