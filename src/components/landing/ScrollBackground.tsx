'use client';

import { useEffect, useRef } from 'react';

const HERO_2_IMAGE = '/hero_2.jpg';

export default function ScrollBackground() {
  const hero2LayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  // Hide the video until the browser confirms it is actually playing.
  // If autoplay is blocked (e.g. Safari Low Power Mode) the video stays
  // hidden and the base photo fallback shows through instead.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const show = () => {
      video.style.opacity = '1';
    };
    // The `playing` event may fire before this effect runs (e.g. cached video
    // or fast load) — check immediately as well as listening for future events.
    if (!video.paused && !video.ended) {
      show();
    }
    video.addEventListener('playing', show);
    return () => video.removeEventListener('playing', show);
  }, []);

  useEffect(() => {
    const update = () => {
      const venueEl = document.getElementById('venue');
      if (!venueEl || !hero2LayerRef.current) {
        return;
      }

      const vh = window.innerHeight;
      const venueTop = venueEl.getBoundingClientRect().top;

      // Fade hero_2 image in as venue section scrolls up into view (venueTop: vh → 0).
      // No JS fade-out needed — FAQ has a solid bg-stone-50 that naturally covers
      // the fixed image layer. Venue and RSVP sections are transparent over the photo.
      const opacity = Math.max(0, Math.min(1, (vh - venueTop) / vh));
      hero2LayerRef.current.style.opacity = String(opacity);
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
      {/* Base photo fallback — always visible beneath the video.
          Shown immediately if the video is still loading or autoplay is
          blocked (e.g. Safari Low Power Mode). */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_2_IMAGE}')` }}
      />
      {/* Hero video — hidden until the browser confirms it is playing */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0, transition: 'opacity 1.5s ease' }}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Venue image — crossfades in as venue section scrolls into view */}
      <div
        ref={hero2LayerRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_2_IMAGE}')`, opacity: 0 }}
      />
    </div>
  );
}
