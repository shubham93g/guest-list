'use client';

import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  identifier: string;
  channel: 'sms' | 'whatsapp' | 'email';
  onBack: () => void;
  mock?: boolean;
  otpTitle: string;
}

export default function OTPForm({ identifier, channel, onBack, mock, otpTitle }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = channel === 'email'
      ? { email: identifier, code }
      : { phone: identifier, code };

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      router.push('/invite');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const backLabel = channel === 'email' ? '← Use a different email' : '← Use a different number';

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <h2 className="text-2xl font-serif text-stone-800 text-center mb-2">
        {otpTitle}
      </h2>
      <p className="text-sm text-stone-500 text-center mb-8">
        {mock
          ? 'Mock mode active.'
          : <>We sent a 6-digit code to{' '}<span className="font-medium text-stone-700">{identifier}</span></>}
      </p>

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
          className="w-full h-14 px-4 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 text-2xl text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="h-12 w-full bg-stone-800 text-white text-sm tracking-wide rounded-xl hover:bg-stone-700 active:bg-stone-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verifying…' : 'Confirm'}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-rose-600 text-center">{error}</p>
      )}

      <button
        onClick={onBack}
        className="mt-6 w-full text-sm text-stone-400 hover:text-stone-600 transition-colors"
      >
        {backLabel}
      </button>
    </div>
  );
}
