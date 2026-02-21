import LoginPage from '@/components/login/LoginPage';
import { AUTH_CHANNEL } from '@/lib/auth';

export default function Page() {
  return <LoginPage channel={AUTH_CHANNEL} />;
}
