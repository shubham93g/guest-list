import { wedding } from '@/config/wedding';

export default function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-stone-50 relative">
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

      <p className="text-xs text-stone-400">
        Formal invitation to follow
      </p>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce text-stone-300">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
