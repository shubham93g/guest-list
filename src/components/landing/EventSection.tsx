import type { WeddingEvent } from '@/types';
import { ui } from '@/lib/ui';

interface EventSectionProps {
  event: WeddingEvent;
  coupleNames: string;
  sectionLabel?: string;
  overlay?: boolean;
}

function toGCalDatetime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export default function EventSection({ event, coupleNames, sectionLabel, overlay = true }: EventSectionProps) {
  if (!event.date && !event.venueName) {
    return null;
  }

  const mapsUrl = event.venueMapUrl || (
    `https://maps.google.com/?q=${encodeURIComponent(
      [event.venueName, event.venueAddress, event.venueCity].filter(Boolean).join(', '),
    )}`
  );

  let calendarLinks: { google: string; ics: string } | null = null;
  if (event.datetimeISO) {
    const start = new Date(event.datetimeISO);
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + event.durationHours * 60 * 60 * 1000);
      const locationParts = [event.venueAddress, event.venueCity, event.venueName].filter(Boolean);
      const title = encodeURIComponent(`${event.title} - ${coupleNames}`);
      const location = encodeURIComponent(locationParts.join(', '));
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//wedding-invite//calendar//EN',
        'BEGIN:VEVENT',
        `DTSTART:${toGCalDatetime(start)}`,
        `DTEND:${toGCalDatetime(end)}`,
        `SUMMARY:${event.title} - ${coupleNames}`,
        ...(locationParts.length > 0 ? [`LOCATION:${locationParts.join(', ')}`] : []),
        'END:VEVENT',
        'END:VCALENDAR',
      ];
      calendarLinks = {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toGCalDatetime(start)}/${toGCalDatetime(end)}&location=${location}`,
        ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join('\r\n') + '\r\n')}`,
      };
    }
  }

  return (
    <section id="venue" className="py-24 px-6 relative">
      {overlay && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 max-w-sm mx-auto">
        {sectionLabel && (
          <p className="text-xs uppercase tracking-[0.3em] text-white mb-10 text-center">
            {sectionLabel}
          </p>
        )}

        <div className="space-y-4">
          {/* Combined date + venue card */}
          <div className={`${ui.formCard} space-y-4 text-center`}>

            {event.title && (
              <div>
                  <p className="text-2xl font-serif text-white">{event.title}</p>
              </div>
                )}

            {/* Date section */}
            {(event.date || event.day || event.time) && (
              <div className="space-y-1">
                {event.date && (
                  <p className="font-medium text-white">{event.date}</p>
                )}
                {event.day && (
                  <p className="text-sm text-white">{event.day}</p>
                )}
                {event.time && (
                  <p className="text-sm text-white">{event.time}</p>
                )}
              </div>
            )}

            {/* Divider — only when both sections have content */}
            {(event.date || event.day || event.time) &&
             (event.venueName || event.venueCity) && (
              <hr className="border-white/10" />
            )}

            {/* Venue section */}
            {(event.venueName || event.venueCity) && (
              <div className="space-y-2">
                {event.venueName && (
                  <p className="font-medium text-white">{event.venueName}</p>
                )}
                {event.venueAddress && (
                  <p className="text-sm text-white">{event.venueAddress}</p>
                )}
                {event.venueCity && !event.venueAddress && (
                  <p className="text-sm text-white">{event.venueCity}</p>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white hover:text-white transition-colors mt-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  View on Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Add to Calendar */}
          {calendarLinks && (
            <details className={`group ${ui.glassCard}`}>
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-6 py-4 cursor-pointer select-none">
                <span className="text-sm text-white">Add to Calendar</span>
                <span className="flex items-center gap-1 text-white">
                  <span className="group-open:hidden text-lg leading-none">+</span>
                  <span className="hidden group-open:flex text-lg leading-none">−</span>
                </span>
              </summary>
              <div className="border-t border-white/10 px-6 py-4 flex flex-col gap-3">
                <a
                  href={calendarLinks.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white hover:text-white transition-colors"
                >
                  Google Calendar
                </a>
                <a
                  href={calendarLinks.ics}
                  download="wedding.ics"
                  className="text-sm text-white hover:text-white transition-colors"
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
