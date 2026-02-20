'use client';

import { useState, FormEvent } from 'react';

interface Props {
  onSuccess: (phone: string, mock?: boolean) => void;
}

export default function PhoneForm({ onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      onSuccess(phone, data.mock === true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <h2 className="text-2xl font-serif text-stone-800 text-center mb-2">
        Welcome
      </h2>
      <p className="text-sm text-stone-500 text-center mb-8">
        Enter your WhatsApp number to receive your invitation code.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <input
            type="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            required
            className="w-full h-12 px-4 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
          />
          <p className="mt-1.5 text-xs text-stone-400 pl-1">
            Include country code, e.g. +91
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !phone}
          className="h-12 w-full bg-stone-800 text-white text-sm tracking-wide rounded-xl hover:bg-stone-700 active:bg-stone-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending code…' : 'Send Code via WhatsApp'}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-rose-600 text-center">{error}</p>
      )}
    </div>
  );
}
