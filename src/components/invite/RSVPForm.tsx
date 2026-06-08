'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { RSVPData, RSVPStatus } from '@/types';
import { ui } from '@/lib/ui';
import ScrollIndicator from '@/components/ScrollIndicator';


type FormState = 'idle' | 'loading' | 'success' | 'error';

type AttendingStatus = Exclude<RSVPStatus, 'pending'>;

const STATUS_LABELS: Record<AttendingStatus, string> = {
  attending_5th: 'Attending Saturday Lunch',
  attending_both: 'Attending Friday & Saturday Lunch',
  declined: 'Unable to attend',
};

const RSVP_OPTIONS: AttendingStatus[] = ['attending_5th', 'attending_both', 'declined'];

interface Props {
  guestName: string;
  existingRSVP?: RSVPData | null;
}

export default function RSVPForm({ guestName, existingRSVP }: Props) {
  const [email, setEmail] = useState(existingRSVP?.email ?? '');
  const [status, setStatus] = useState<AttendingStatus | ''>(
    existingRSVP?.status && existingRSVP.status !== 'pending' ? existingRSVP.status : ''
  );
  const [guestCount, setGuestCount] = useState<number>(existingRSVP?.guestCount ?? 1);
  const [plusOneNames, setPlusOneNames] = useState<string[]>(() => {
    const needed = Math.max(0, (existingRSVP?.guestCount ?? 1) - 1);
    const names = existingRSVP?.plusOneNames
      ? existingRSVP.plusOneNames.split(',').map((n) => n.trim())
      : [];
    while (names.length < needed) { names.push(''); }
    return names.slice(0, needed);
  });
  const [requiresParking, setRequiresParking] = useState(existingRSVP?.requiresParking ?? false);
  const [requiresAccommodation, setRequiresAccommodation] = useState(existingRSVP?.requiresAccommodation ?? false);
  const [dietaryNotes, setDietaryNotes] = useState(existingRSVP?.dietaryNotes ?? '');
  const [message, setMessage] = useState(existingRSVP?.message ?? '');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formState === 'success') {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [formState]);

  const isAttending = status === 'attending_both' || status === 'attending_5th';

  function handleStatusChange(newStatus: AttendingStatus) {
    setStatus(newStatus);
  }

  function handleCountChange(newCount: number) {
    setGuestCount(newCount);
    const needed = newCount - 1;
    setPlusOneNames((prev) => {
      const next = [...prev];
      while (next.length < needed) {
        next.push('');
      }
      return next.slice(0, needed);
    });
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!status) {
      return;
    }
    setFormState('loading');
    setErrorMsg('');

    try {
      const declined = status === 'declined';
      const submitGuestCount = declined ? 1 : guestCount;
      const submitPlusOneNames = declined ? [] : plusOneNames.filter((n) => n.trim());
      const submitRequiresParking = declined ? false : requiresParking;
      const submitRequiresAccommodation = declined ? false : requiresAccommodation;
      const submitDietaryNotes = declined ? '' : dietaryNotes;

      const res = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          status,
          guestCount: submitGuestCount,
          plusOneNames: submitPlusOneNames.join(', '),
          requiresParking: submitRequiresParking,
          requiresAccommodation: submitRequiresAccommodation,
          dietaryNotes: submitDietaryNotes,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Something went wrong.');
        setFormState('error');
        return;
      }

      setGuestCount(submitGuestCount);
      setPlusOneNames(submitPlusOneNames);
      setRequiresParking(submitRequiresParking);
      setRequiresAccommodation(submitRequiresAccommodation);
      setDietaryNotes(submitDietaryNotes);
      setFormState('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div ref={successRef} className="max-w-sm mx-auto px-6 pb-12">
        <div className={`${ui.formCard} text-center`}>
          <div className="text-3xl mb-4">{isAttending ? '🎉' : '💌'}</div>
          <h3 className="text-xl font-serif text-white mb-2">
            {isAttending ? "We can't wait to see you!" : 'Thank you for letting us know'}
          </h3>
          <p className="text-sm text-white/70">
            {isAttending
              ? existingRSVP
                ? "Your RSVP has been updated. We can't wait to see you!"
                : 'Your RSVP has been received. More details to follow.'
              : existingRSVP
                ? 'Your RSVP has been updated. Thank you for letting us know.'
                : 'We will miss you. Wishing you all the best.'}
          </p>
        </div>
        <ScrollIndicator className="flex justify-center mt-10 animate-bounce text-white/50" />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 pb-12">
      <h2 className="text-xl font-serif text-white text-center mb-6">RSVP</h2>

      <div className={ui.formCard}>
        {existingRSVP && (
          <p className={`${ui.infoBox} px-4 py-3 text-sm text-white/75 text-center mb-4`}>
            You previously responded as{' '}
            <span className="font-medium text-white/90">
              {STATUS_LABELS[existingRSVP.status as AttendingStatus] ?? existingRSVP.status}
            </span>
            . Feel free to update your response below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" suppressHydrationWarning>
          {/* Email */}
          <div>
            <label className="block text-xs text-white/70 mb-1.5 pl-1">
              Email address (optional)
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
              suppressHydrationWarning
            />
          </div>

          {/* Attendance status */}
          <div className="flex flex-col gap-3">
            {RSVP_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleStatusChange(opt)}
                className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                  status === opt ? ui.toggleSelected : ui.toggleUnselected
                }`}
              >
                {STATUS_LABELS[opt]}
              </button>
            ))}
          </div>

          {isAttending && (
            <>
              {/* How many people attending */}
              <div>
                <label className="block text-xs text-white/70 mb-1.5 pl-1">
                  How many people are attending?
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => handleCountChange(Number(e.target.value))}
                  className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                  suppressHydrationWarning
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? 'Just me' : `${n} people`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary guest name (read-only) */}
              <div>
                <label className="block text-xs text-white/70 mb-1.5 pl-1">
                  Guest 1&apos;s name
                </label>
                <div
                  className={`w-full h-12 px-4 flex items-center text-sm opacity-50 cursor-not-allowed ${ui.inputBase}`}
                >
                  {guestName}
                </div>
              </div>

              {/* Additional guest names */}
              {plusOneNames.map((name, i) => (
                <div key={i}>
                  <label className="block text-xs text-white/70 mb-1.5 pl-1">
                    Guest {i + 2}&apos;s name
                  </label>
                  <input
                    type="text"
                    placeholder={`Guest ${i + 2}'s name`}
                    value={name}
                    onChange={(e) => {
                      const next = [...plusOneNames];
                      next[i] = e.target.value;
                      setPlusOneNames(next);
                    }}
                    className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                    suppressHydrationWarning
                  />
                </div>
              ))}

              {/* Logistics */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresParking}
                    onChange={(e) => setRequiresParking(e.target.checked)}
                    className="w-5 h-5 rounded accent-stone-400"
                    suppressHydrationWarning
                  />
                  <span className="text-sm text-white/80">I will need parking</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresAccommodation}
                    onChange={(e) => setRequiresAccommodation(e.target.checked)}
                    className="w-5 h-5 rounded accent-stone-400"
                    suppressHydrationWarning
                  />
                  <span className="text-sm text-white/80">I will need accommodation</span>
                </label>
              </div>

              {/* Dietary notes */}
              <div>
                <label className="block text-xs text-white/70 mb-1.5 pl-1">
                  Dietary requirements (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. vegetarian, nut allergy"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                  suppressHydrationWarning
                />
              </div>
            </>
          )}

          {/* Message */}
          <div>
            <label className="block text-xs text-white/70 mb-1.5 pl-1">
              Anything you&apos;d like us to know? (optional)
            </label>
            <textarea
              placeholder="A message for the couple, your travel details if you require accommodation"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 text-sm resize-none ${ui.inputBase}`}
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={!status || formState === 'loading'}
            className={`mt-2 ${ui.primaryButton}`}
          >
            {formState === 'loading' ? 'Submitting…' : 'Submit RSVP'}
          </button>

          {formState === 'error' && (
            <p className={ui.errorText}>{errorMsg}</p>
          )}
        </form>
      </div>
    </div>
  );
}
