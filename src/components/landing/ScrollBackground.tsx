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
    // Use 100lvh (large viewport height) instead of inset-0 / bottom:0.
    // On mobile, browser chrome (address bar + tab bar) shows/hides as the user
    // scrolls, changing window.innerHeight. With bottom:0 the container would
    // resize to match, forcing background-size:cover to recalculate and causing
    // a visible jump. 100lvh is fixed to the largest possible viewport (chrome
    // hidden), so the container never needs to resize — it simply extends a few
    // pixels below the fold when chrome is visible, which is invisible to the user.
    // Falls back to 100vh on browsers that don't support lvh (pre-2022).
    <div
      className="fixed top-0 left-0 w-full -z-10 overflow-hidden"
      style={{ height: '100lvh' }}
    >
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
