'use client';

import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '@/lib/ui';

interface Props {
  phone: string;
  onBack: () => void;
  otpChannel: 'sms' | 'whatsapp';
}

const OTP_CHANNEL_TITLE = {
  sms: 'Check your messages',
  whatsapp: 'Check WhatsApp',
} as const;

export default function OTPForm({ phone, onBack, otpChannel }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const otpTitle = OTP_CHANNEL_TITLE[otpChannel];

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
        setLoading(false);
        return;
      }

      router.push('/invite');
    } catch {
      console.error('[OTPForm] login-otp request failed');
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className={ui.formWrapper}>
      <h2 className="text-2xl font-serif text-white text-center mb-2">
        {otpTitle}
      </h2>
      <p className="text-sm text-white/70 text-center mb-8">
        <>We sent a 6-digit code to{' '}<span className="font-medium text-white/90">{phone}</span></>
      </p>

      <div className={ui.formCard}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* OTP uses larger sizing (h-14, text-2xl) — not the standard h-12 */}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={loading}
            required
            className={`w-full h-14 px-4 text-2xl text-center tracking-widest ${ui.inputBase}`}
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className={ui.primaryButton}
          >
            {loading ? 'Verifying…' : 'Confirm'}
          </button>
        </form>

        {error && (
          <p className={`mt-4 ${ui.errorText}`}>{error}</p>
        )}

        <button
          onClick={onBack}
          className={`mt-6 w-full text-sm ${ui.secondaryLink}`}
        >
          ← Use a different number
        </button>
      </div>
    </div>
  );
}
