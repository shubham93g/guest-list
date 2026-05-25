'use client';

import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  phone: string;
  email: string;
  onBack: () => void;
  otpChannel: 'sms' | 'whatsapp' | 'email';
}

const OTP_CHANNEL_TITLE = {
  sms: 'Check your messages',
  whatsapp: 'Check WhatsApp',
  email: 'Check your email',
} as const;

export default function OTPForm({ phone, email, onBack, otpChannel }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // The non-empty field is the one the server will validate against RSVP_CHANNEL.
  const contact = email || phone;
  const backLabel = email ? '← Use a different address' : '← Use a different number';
  const otpTitle = OTP_CHANNEL_TITLE[otpChannel];

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined, code }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      router.push('/invite');
    } catch {
      console.error('[OTPForm] login-otp request failed');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <h2 className="text-2xl font-serif text-white text-center mb-2">
        {otpTitle}
      </h2>
      <p className="text-sm text-white/70 text-center mb-8">
        <>We sent a 6-digit code to{' '}<span className="font-medium text-white/90">{contact}</span></>
      </p>

      <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            className="w-full h-14 px-4 bg-white/90 border border-white/50 rounded-xl text-stone-800 placeholder-stone-400 text-2xl text-center tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-white/40 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="h-12 w-full bg-white text-stone-800 text-sm tracking-wide font-medium rounded-xl border border-white/60 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying…' : 'Confirm'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-rose-300 text-center">{error}</p>
        )}

        <button
          onClick={onBack}
          className="mt-6 w-full text-sm text-white/60 hover:text-white/90 hover:underline underline-offset-4 transition-colors"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
