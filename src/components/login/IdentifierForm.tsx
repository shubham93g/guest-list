'use client';

import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '@/lib/ui';

interface Props {
  onSuccess: (phone: string) => void;
}

export default function IdentifierForm({ onSuccess }: Props) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // + prefix is required by Twilio (E.164 format).
    // Sheets stores digits-only, so sheets.ts normalises by stripping + before comparing.
    const phone = `+${countryCode}${phoneNumber}`;

    try {
      const res = await fetch('/api/auth/login-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        setLoading(false);
        return;
      }

      if (data.skipOtp === true) {
        router.push('/invite');
        return;
      }
      onSuccess(phone);
    } catch {
      console.error('[IdentifierForm] login-id request failed');
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const submitDisabled = loading || !countryCode || !phoneNumber;

  return (
    <div className={ui.formWrapper}>
      <h2 className="text-2xl font-serif text-white text-center mb-2">
        Welcome
      </h2>
      <p className="text-sm text-white/70 text-center mb-8">
        Enter your phone number to access your invitation.
      </p>

      <div className={ui.formCard}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 bg-white/90 border border-white/50 rounded-xl text-stone-500 text-base select-none shrink-0">
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
              className={`w-16 h-12 px-3 text-base text-center ${ui.inputBase}`}
              suppressHydrationWarning
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              className={`min-w-0 flex-1 h-12 px-4 text-base ${ui.inputBase}`}
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className={ui.primaryButton}
          >
            {loading ? 'Logging in…' : 'Proceed'}
          </button>
        </form>

        {error && (
          <p className={`mt-4 ${ui.errorText}`}>{error}</p>
        )}
      </div>
    </div>
  );
}
