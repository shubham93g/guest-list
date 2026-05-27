'use client';

import { useEffect, useRef } from 'react';
import { ui } from '@/lib/ui';

const HERO_IMAGE = '/hero.jpg';
const CROSSFADE_AHEAD = 1.5; // seconds before end to trigger the crossfade; matches CSS transition duration
const HERO_VIDEOS = [
  '/hero4.mp4',
  '/hero.mp4',
  '/hero3.mp4',
  '/hero6.mp4',
  // Add more video filenames here as you drop them into /public
];

export default function ScrollBackground() {
  const heroLayerRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<'a' | 'b'>('a');
  const videoIndexRef = useRef(0);
  const transitioningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Two video elements crossfade on each transition so the background image
  // never shows through. Video A starts; when it ends, Video B fades in while
  // A fades out. They then alternate roles for every subsequent video.
  // The inactive element always preloads the upcoming video so the crossfade
  // can begin immediately with no buffering delay.
  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) {
      return;
    }

    const getActive = (): HTMLVideoElement => activeRef.current === 'a' ? videoA : videoB;
    const getInactive = (): HTMLVideoElement => activeRef.current === 'a' ? videoB : videoA;

    // Buffer the next video in the playlist into `intoElement` without playing it.
    const preloadNext = (intoElement: HTMLVideoElement) => {
      const nextIndex = (videoIndexRef.current + 1) % HERO_VIDEOS.length;
      intoElement.src = HERO_VIDEOS[nextIndex];
      intoElement.load();
    };

    // Crossfade to the next video. Called by timeupdate (primary) and ended (fallback).
    const startTransition = () => {
      if (transitioningRef.current) {
        return;
      }
      transitioningRef.current = true;

      const prev = getActive();
      const next = getInactive();
      videoIndexRef.current = (videoIndexRef.current + 1) % HERO_VIDEOS.length;

      // Only set src if preload didn't run (safety net for very short videos).
      if (!next.src.endsWith(HERO_VIDEOS[videoIndexRef.current])) {
        next.src = HERO_VIDEOS[videoIndexRef.current];
      }

      const onNextPlaying = () => {
        next.style.opacity = '1';
        prev.style.opacity = '0';
        activeRef.current = activeRef.current === 'a' ? 'b' : 'a';
        transitioningRef.current = false;
        next.removeEventListener('playing', onNextPlaying);
        // Wait for prev's fade-out to complete before calling load() on it —
        // load() blanks the element, which would flash through the still-visible fade.
        const onFadeOut = () => {
          prev.removeEventListener('transitionend', onFadeOut);
          preloadNext(prev);
        };
        prev.addEventListener('transitionend', onFadeOut);
      };
      next.addEventListener('playing', onNextPlaying);
      next.play().catch(() => {});
    };

    // Set initial source on Video A and fade it in once playback is confirmed.
    // If autoplay is blocked (e.g. Safari Low Power Mode) it stays hidden and
    // the base photo fallback shows through instead.
    videoA.src = HERO_VIDEOS[videoIndexRef.current];
    const handleInitialPlaying = () => {
      videoA.style.opacity = '1';
      videoA.removeEventListener('playing', handleInitialPlaying);
      preloadNext(videoB); // start buffering index 1 into Video B immediately
    };
    videoA.addEventListener('playing', handleInitialPlaying);
    videoA.play().catch(() => {}); // start imperatively — no autoPlay attribute on the element

    // Primary: trigger crossfade CROSSFADE_AHEAD seconds before the video ends
    // so the next video is already buffered and plays with no freeze frame.
    const handleTimeUpdate = () => {
      const active = getActive();
      if (active.duration && active.duration - active.currentTime <= CROSSFADE_AHEAD) {
        startTransition();
      }
    };

    // Fallback: catches very short videos or slow-buffer edge cases.
    // Only fires if the ending video is still the active one — prevents a
    // double-trigger when ended fires after timeupdate has already completed
    // the transition and reset transitioningRef to false.
    const handleEndedA = () => { if (getActive() === videoA) { startTransition(); } };
    const handleEndedB = () => { if (getActive() === videoB) { startTransition(); } };

    videoA.addEventListener('timeupdate', handleTimeUpdate);
    videoB.addEventListener('timeupdate', handleTimeUpdate);
    videoA.addEventListener('ended', handleEndedA);
    videoB.addEventListener('ended', handleEndedB);

    // Mobile browsers pause video when the page is hidden (e.g. user switches
    // to another app). Resume the active video; also resume the inactive one if
    // a crossfade was in progress when the page was hidden.
    //
    // On Chrome iOS, visibilitychange can fire before the browser has fully
    // restored the foreground context, causing play() to be rejected. A short
    // delay gives it time to settle. window 'focus' is also used as an
    // additional trigger since it fires more reliably on iOS for app-switching.
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    const resumePlayback = () => {
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
      }
      resumeTimer = setTimeout(() => {
        resumeTimer = null;
        getActive().play().catch(() => {});
        if (transitioningRef.current) {
          getInactive().play().catch(() => {});
        }
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumePlayback();
      }
    };
    const handleFocus = () => { resumePlayback(); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      videoA.removeEventListener('playing', handleInitialPlaying);
      videoA.removeEventListener('timeupdate', handleTimeUpdate);
      videoB.removeEventListener('timeupdate', handleTimeUpdate);
      videoA.removeEventListener('ended', handleEndedA);
      videoB.removeEventListener('ended', handleEndedB);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
      }
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const venueEl = document.getElementById('venue');
      if (!venueEl || !heroLayerRef.current) {
        return;
      }

      const vh = window.innerHeight;
      const venueTop = venueEl.getBoundingClientRect().top;

      // Fade hero image in as venue section scrolls up into view (venueTop: vh → 0).
      const opacity = Math.max(0, Math.min(1, (vh - venueTop) / vh));
      heroLayerRef.current.style.opacity = String(opacity);
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
        style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
      />
      {/* Video A — fades in on initial play; crossfades with Video B on transitions.
          Both start hidden; src and playback are managed imperatively in the effect.
          No autoPlay — avoids the browser auto-starting preloaded videos when src changes. */}
      <video
        ref={videoARef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0, transition: 'opacity 1.5s ease' }}
        muted
        playsInline
      />
      {/* Video B — starts hidden; swaps in during crossfade */}
      <video
        ref={videoBRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0, transition: 'opacity 1.5s ease' }}
        muted
        playsInline
      />
      {/* Venue image — crossfades in as venue section scrolls into view */}
      <div
        ref={heroLayerRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_IMAGE}')`, opacity: 0 }}
      />
      {/* Dark overlay — fixed with the background so it covers overscroll areas too */}
      <div className={`absolute inset-0 ${ui.overlay}`} />
    </div>
  );
}
