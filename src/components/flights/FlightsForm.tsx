'use client';

import { useState, useEffect, useRef, SyntheticEvent } from 'react';
import type { FlightDetails } from '@/types';
import { indianEvent, receptionEvent } from '@/config/wedding';
import { ui } from '@/lib/ui';
import ScrollIndicator from '@/components/ScrollIndicator';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  existingFlight?: FlightDetails | null;
  existingEmail?: string;
}

export default function FlightsForm({ existingFlight, existingEmail }: Props) {
  const [email, setEmail] = useState(existingEmail ?? '');
  const [arrivalFrom, setArrivalFrom] = useState(existingFlight?.arrivalFrom ?? '');
  const [arrivalDate, setArrivalDate] = useState(
    existingFlight?.arrivalDate ?? indianEvent.datetimeISO.slice(0, 10)
  );
  const [arrivalTime, setArrivalTime] = useState(existingFlight?.arrivalTime ?? '');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState(existingFlight?.arrivalFlightNumber ?? '');
  const [departureDate, setDepartureDate] = useState(
    existingFlight?.departureDate ?? receptionEvent.datetimeISO.slice(0, 10)
  );
  const [departureTime, setDepartureTime] = useState(existingFlight?.departureTime ?? '');
  const [departureFlightNumber, setDepartureFlightNumber] = useState(existingFlight?.departureFlightNumber ?? '');
  const [message, setMessage] = useState(existingFlight?.message ?? '');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formState === 'success') {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [formState]);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/flights/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          arrivalFrom,
          arrivalDate,
          arrivalTime,
          arrivalFlightNumber,
          departureDate,
          departureTime,
          departureFlightNumber,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
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
      <div ref={successRef} className="max-w-sm mx-auto px-6 pb-12">
        <div className={`${ui.formCard} text-center`}>
          <div className="text-3xl mb-4">✈️</div>
          <h3 className="text-xl font-serif text-white mb-2">Thank you</h3>
          <p className="text-sm text-white/70">
            {existingFlight
              ? 'Your flight details have been updated.'
              : 'Your flight details have been received.'}
          </p>
        </div>
        <ScrollIndicator className="flex justify-center mt-10 animate-bounce text-white/50" />
      </div>
    );
  }

  const submitDisabled =
    formState === 'loading' ||
    !email ||
    !arrivalFrom ||
    !arrivalDate ||
    !arrivalTime ||
    !arrivalFlightNumber ||
    !departureDate ||
    !departureTime ||
    !departureFlightNumber;

  return (
    <div className="max-w-sm mx-auto px-6 pb-12">
      <h2 className="text-xl font-serif text-white text-center mb-2">Flight Details</h2>
      <p className="text-sm text-white/70 text-center mb-6">
        Let us know your travel plans so we can coordinate your hotel check-in and check-out.
      </p>

      <div className={ui.formCard}>
        {existingFlight && (
          <p className={`${ui.infoBox} px-4 py-3 text-sm text-white/75 text-center mb-4`}>
            You previously submitted your flight details. Feel free to update them below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" suppressHydrationWarning>
          {/* Email */}
          <div>
            <label className="block text-xs text-white/70 mb-1.5 pl-1">Email address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
              required
              suppressHydrationWarning
            />
            <p className="text-xs text-white/50 mt-1.5 pl-1">
              We&apos;ll use this to reach out with updates on hotel check-in, check-out, and other travel logistics.
            </p>
          </div>

          {/* Arrival */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-white/60 pl-1">Arrival</p>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Flying from</label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={arrivalFrom}
                onChange={(e) => setArrivalFrom(e.target.value)}
                className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Date</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className={`w-full h-12 px-3 text-sm appearance-none ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Time</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className={`w-full h-12 px-3 text-sm appearance-none ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Flight number</label>
              <input
                type="text"
                placeholder="e.g. SQ423"
                value={arrivalFlightNumber}
                onChange={(e) => setArrivalFlightNumber(e.target.value)}
                className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Departure */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-white/60 pl-1">Departure</p>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Date</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className={`w-full h-12 px-3 text-sm appearance-none ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Time</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className={`w-full h-12 px-3 text-sm appearance-none ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1.5 pl-1">Flight number</label>
              <input
                type="text"
                placeholder="e.g. SQ424"
                value={departureFlightNumber}
                onChange={(e) => setDepartureFlightNumber(e.target.value)}
                className={`w-full h-12 px-4 text-sm ${ui.inputBase}`}
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs text-white/70 mb-1.5 pl-1">
              Anything else about your travel we should know? (optional)
            </label>
            <textarea
              placeholder="Any other travel details"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 text-sm resize-none ${ui.inputBase}`}
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className={`mt-2 ${ui.primaryButton}`}
          >
            {formState === 'loading' ? 'Submitting…' : 'Submit Flight Details'}
          </button>

          {formState === 'error' && (
            <p className={ui.errorText}>{errorMsg}</p>
          )}
        </form>
      </div>
    </div>
  );
}
