'use client';

import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  channel: 'phone' | 'email';
  onSuccess: (phone: string, email: string) => void;
}

const RSVP_CHANNEL_COPY = {
  phone: {
    sendInstruction: 'Enter your phone number to access your invitation.',
    sendLabel: 'Proceed',
  },
  email: {
    sendInstruction: 'Enter your email address to access your invitation.',
    sendLabel: 'Proceed',
  },
} as const;

export default function IdentifierForm({ channel, onSuccess }: Props) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { sendInstruction, sendLabel } = RSVP_CHANNEL_COPY[channel];

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // For phone channels: + prefix is required by Twilio (E.164 format).
    // Sheets stores digits-only, so sheets.ts normalises by stripping + before comparing.
    const phoneValue = channel === 'phone' ? `+${countryCode}${phoneNumber}` : '';
    const emailValue = channel === 'email' ? email.trim().toLowerCase() : '';

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneValue || undefined, email: emailValue || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      if (data.skipOtp === true) {
        router.push('/invite');
        return;
      }
      onSuccess(phoneValue, emailValue);
    } catch {
      console.error('[IdentifierForm] send-otp request failed');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isPhoneChannel = channel === 'phone';
  const submitDisabled = loading || (isPhoneChannel ? !countryCode || !phoneNumber : !email);

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <h2 className="text-2xl font-serif text-stone-800 text-center mb-2">
        Welcome
      </h2>
      <p className="text-sm text-stone-500 text-center mb-8">
        {sendInstruction}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {channel === 'email' ? (
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="w-full h-12 px-4 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 border border-stone-300 rounded-xl bg-stone-50 text-stone-500 text-base select-none shrink-0">
              +
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="65"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              className="w-16 h-12 px-3 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 text-base text-center focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              className="flex-1 h-12 px-4 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitDisabled}
          className="h-12 w-full bg-stone-800 text-white text-sm tracking-wide rounded-xl hover:bg-stone-700 active:bg-stone-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in…' : sendLabel}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-rose-600 text-center">{error}</p>
      )}
    </div>
  );
}
