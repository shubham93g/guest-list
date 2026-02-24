'use client';

import { useEffect, useRef } from 'react';

// Hero: placeholder couple photo — replace with your own before launch.
// Venue: The Fullerton Hotel Singapore at night (Pexels, free to use).
const HERO_IMAGE = 'https://picsum.photos/seed/wedding-couple/1920/1080';
const VENUE_IMAGE =
  'https://images.pexels.com/photos/10531440/pexels-photo-10531440.jpeg?auto=compress&cs=tinysrgb&w=1920';

export default function ScrollBackground() {
  const venueLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const venueEl = document.getElementById('venue');
      const rsvpEl = document.getElementById('rsvp');
      if (!venueEl || !rsvpEl || !venueLayerRef.current) {
        return;
      }

      const vh = window.innerHeight;
      const venueTop = venueEl.getBoundingClientRect().top;
      const rsvpTop = rsvpEl.getBoundingClientRect().top;

      // Fade venue image in as venue section scrolls up into view (venueTop: vh → 0)
      const fadeIn = Math.max(0, Math.min(1, (vh - venueTop) / vh));
      // Fade venue image out as RSVP section scrolls up into view (rsvpTop: vh → 0)
      const fadeOut = Math.max(0, Math.min(1, (vh - rsvpTop) / vh));

      venueLayerRef.current.style.opacity = String(fadeIn * (1 - fadeOut));
    };

    const onScroll = () => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Hero image — always visible as the base layer */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
      />
      {/* Venue image — crossfades in as venue section scrolls into view */}
      <div
        ref={venueLayerRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${VENUE_IMAGE}')`, opacity: 0 }}
      />
    </div>
  );
}
