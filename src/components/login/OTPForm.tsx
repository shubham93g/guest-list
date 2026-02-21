'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  phone: string;
  onBack: () => void;
  mock?: boolean;
}

export default function OTPForm({ phone, onBack, mock }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!res.ok) {
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

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <h2 className="text-2xl font-serif text-stone-800 text-center mb-2">
        Check WhatsApp
      </h2>
      <p className="text-sm text-stone-500 text-center mb-8">
        {mock
          ? 'Mock mode active.'
          : <>We sent a 6-digit code to{' '}<span className="font-medium text-stone-700">{phone}</span></>}
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
        ← Use a different number
      </button>
    </div>
  );
}
