import { wedding } from '@/config/wedding';

function toGCalDatetime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export default function VenueSection() {
  if (!wedding.date && !wedding.venueName) {
    return null;
  }

  const mapsQuery = encodeURIComponent(
    wedding.venueAddress || `${wedding.venueName}, ${wedding.venueCity}`,
  );
  const mapsUrl = `https://maps.google.com/?q=${mapsQuery}`;

  let calendarLinks: { google: string; ics: string } | null = null;
  if (wedding.datetimeISO) {
    const start = new Date(wedding.datetimeISO);
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      const title = encodeURIComponent(`${wedding.coupleNames} Wedding`);
      const location = encodeURIComponent(
        [wedding.venueAddress, wedding.venueCity, wedding.venueName].filter(Boolean).join(', '),
      );
      calendarLinks = {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toGCalDatetime(start)}/${toGCalDatetime(end)}&location=${location}`,
        ics: '/api/calendar',
      };
    }
  }

  return (
    <section id="venue" className="py-24 px-6 relative">
      {/* Dark overlay — matches hero; white cards read cleanly on top */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-10 text-center">
          Venue &amp; Date
        </p>

        <div className="space-y-4">
          {/* Date card */}
          {(wedding.date || wedding.day || wedding.time) && (
            <div className="border border-stone-200 rounded-2xl p-6 bg-white space-y-2 text-center">
              {wedding.date && (
                <p className="text-2xl font-serif text-stone-800">{wedding.date}</p>
              )}
              {wedding.day && (
                <p className="text-sm text-stone-400 uppercase tracking-wider">{wedding.day}</p>
              )}
              {wedding.time && (
                <p className="text-sm text-stone-500">{wedding.time}</p>
              )}
            </div>
          )}

          {/* Venue card */}
          {(wedding.venueName || wedding.venueCity) && (
            <div className="border border-stone-200 rounded-2xl p-6 bg-white space-y-3 text-center">
              {wedding.venueName && (
                <p className="font-medium text-stone-800">{wedding.venueName}</p>
              )}
              {wedding.venueAddress && (
                <p className="text-sm text-stone-500">{wedding.venueAddress}</p>
              )}
              {wedding.venueCity && !wedding.venueAddress && (
                <p className="text-sm text-stone-400">{wedding.venueCity}</p>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors mt-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                View on Google Maps
              </a>
            </div>
          )}

          {/* Add to Calendar */}
          {calendarLinks && (
            <details className="group border border-stone-200 rounded-2xl bg-white overflow-hidden">
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-6 py-4 cursor-pointer select-none">
                <span className="text-sm text-stone-600">Add to Calendar</span>
                <span className="flex items-center gap-1 text-stone-400">
                  <span className="group-open:hidden text-lg leading-none">+</span>
                  <span className="hidden group-open:flex text-lg leading-none">−</span>
                </span>
              </summary>
              <div className="border-t border-stone-100 px-6 py-4 flex flex-col gap-3">
                <a
                  href={calendarLinks.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Google Calendar
                </a>
                <a
                  href={calendarLinks.ics}
                  download="wedding.ics"
                  className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Download .ics file
                </a>
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
