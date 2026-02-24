'use client';

import { useEffect, useRef } from 'react';

// Hero: wedding couple in landscape orientation (Pexels photo 4942920, free to use).
// Replace with your own photo before launch.
// Venue: The Fullerton Hotel Singapore at night (Pexels photo 10531440, free to use).
const HERO_IMAGE =
  'https://images.pexels.com/photos/4942920/pexels-photo-4942920.jpeg?auto=compress&cs=tinysrgb&w=1920';
const VENUE_IMAGE =
  'https://images.pexels.com/photos/10531440/pexels-photo-10531440.jpeg?auto=compress&cs=tinysrgb&w=1920';

export default function ScrollBackground() {
  const venueLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const venueEl = document.getElementById('venue');
      if (!venueEl || !venueLayerRef.current) {
        return;
      }

      const vh = window.innerHeight;
      const venueTop = venueEl.getBoundingClientRect().top;

      // Fade venue image in as venue section scrolls up into view (venueTop: vh → 0).
      // No JS fade-out needed — RSVP and FAQ have solid section backgrounds that
      // naturally cover the fixed image layer once the user scrolls past venue.
      const opacity = Math.max(0, Math.min(1, (vh - venueTop) / vh));
      venueLayerRef.current.style.opacity = String(opacity);
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
