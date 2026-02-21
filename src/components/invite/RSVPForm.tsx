'use client';

import { useState, FormEvent } from 'react';
import type { RSVPData, RSVPStatus } from '@/types';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const RSVP_OPTIONS = ['attending', 'declined'] as const satisfies RSVPStatus[];

interface Props {
  existingRSVP?: RSVPData | null;
}

export default function RSVPForm({ existingRSVP }: Props) {
  const [status, setStatus] = useState<RSVPStatus | ''>(existingRSVP?.status ?? '');
  const [dietaryNotes, setDietaryNotes] = useState(existingRSVP?.dietaryNotes ?? '');
  const [plusOne, setPlusOne] = useState(existingRSVP?.plusOneAttending ?? false);
  const [plusOneName, setPlusOneName] = useState(existingRSVP?.plusOneName ?? '');
  const [notes, setNotes] = useState(existingRSVP?.notes ?? '');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!status) {
      return;
    }
    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          dietaryNotes,
          plusOneAttending: plusOne,
          plusOneName,
          notes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong.');
        setFormState('error');
        return;
      }

      setFormState('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div className="max-w-sm mx-auto px-6 py-8 text-center">
        <div className="text-3xl mb-4">🎉</div>
        <h3 className="text-xl font-serif text-stone-800 mb-2">
          {status === 'attending' ? "We can't wait to see you!" : 'Thank you for letting us know'}
        </h3>
        <p className="text-sm text-stone-500">
          {status === 'attending'
            ? existingRSVP
              ? "Your RSVP has been updated. We can't wait to see you!"
              : 'Your RSVP has been received. More details to follow.'
            : existingRSVP
              ? 'Your RSVP has been updated. Thank you for letting us know.'
              : 'We will miss you. Wishing you all the best.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 pb-12">
      <h2 className="text-xl font-serif text-stone-800 text-center mb-6">RSVP</h2>

      {existingRSVP && (
        <p className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-600 text-center mb-4">
          You previously responded as{' '}
          <span className="font-medium">
            {existingRSVP.status === 'attending' ? 'Attending' : 'Unable to attend'}
          </span>
          . Feel free to update your response below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Attending or not */}
        <div className="grid grid-cols-2 gap-3">
          {RSVP_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatus(opt)}
              className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                status === opt
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              {opt === 'attending' ? 'Attending' : 'Unable to attend'}
            </button>
          ))}
        </div>

        {status === 'attending' && (
          <>
            {/* Dietary notes */}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5 pl-1">
                Dietary requirements (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. vegetarian, nut allergy"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className="w-full h-12 px-4 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>

            {/* Plus one */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  className="w-5 h-5 rounded accent-stone-700"
                />
                <span className="text-sm text-stone-700">I&apos;m bringing a plus one</span>
              </label>
            </div>

            {plusOne && (
              <input
                type="text"
                placeholder="Plus one's name"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                className="w-full h-12 px-4 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            )}

            {/* Additional notes */}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5 pl-1">
                Anything else you&apos;d like us to know? (optional)
              </label>
              <textarea
                placeholder="Message for the couple…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!status || formState === 'loading'}
          className="h-12 w-full bg-stone-800 text-white text-sm tracking-wide rounded-xl hover:bg-stone-700 active:bg-stone-900 disabled:opacity-40 transition-colors mt-2"
        >
          {formState === 'loading' ? 'Submitting…' : 'Submit RSVP'}
        </button>

        {formState === 'error' && (
          <p className="text-sm text-rose-600 text-center">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}
