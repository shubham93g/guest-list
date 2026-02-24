import Link from 'next/link';
import { wedding } from '@/config/wedding';

export default function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-stone-50">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-6">
        Save the Date
      </p>

      <h1 className="text-5xl sm:text-6xl font-serif text-stone-800 mb-4 leading-tight">
        {wedding.coupleNames}
      </h1>

      {wedding.date && (
        <p className="text-lg text-stone-500 mb-12">{wedding.date}</p>
      )}

      <div className="w-12 h-px bg-stone-300 mb-12" />

      <Link
        href="/login"
        className="inline-flex items-center justify-center h-12 px-8 bg-stone-800 text-white text-sm tracking-wide rounded-full hover:bg-stone-700 active:bg-stone-900 transition-colors"
      >
        RSVP
      </Link>

      <p className="mt-6 text-xs text-stone-400">
        Formal invitation to follow
      </p>
    </section>
  );
}
