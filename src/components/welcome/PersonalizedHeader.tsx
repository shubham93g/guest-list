import type { Guest, EventDetails } from '@/types';

interface Props {
  guest: Guest;
  event: EventDetails;
}

export default function PersonalizedHeader({ guest, event }: Props) {
  const firstName = guest.name.split(' ')[0] || 'there';

  return (
    <div className="text-center px-6 pt-12 pb-8">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-6">
        Dear {firstName},
      </p>

      <h1 className="text-4xl sm:text-5xl font-serif text-stone-800 mb-3">
        {event.coupleNames}
      </h1>

      <p className="text-stone-500 mb-10 text-sm">
        request the pleasure of your company
      </p>

      <div className="max-w-xs mx-auto border border-stone-200 rounded-2xl p-6 bg-white shadow-sm space-y-3">
        <p className="text-2xl font-serif text-stone-800">{event.weddingDate}</p>
        {event.weddingDay && (
          <p className="text-sm text-stone-400 uppercase tracking-wider">{event.weddingDay}</p>
        )}
        {(event.venueName || event.venueCity) && (
          <>
            <div className="w-8 h-px bg-stone-200 mx-auto" />
            {event.venueName && (
              <p className="font-medium text-stone-700 text-sm">{event.venueName}</p>
            )}
            {event.venueCity && (
              <p className="text-xs text-stone-400">{event.venueCity}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
