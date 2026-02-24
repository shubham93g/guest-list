import { wedding } from '@/config/wedding';

export default function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
      {/* Dark overlay — keeps white text sharp over the background photo */}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6">
          Save the Date
        </p>

        <h1 className="text-5xl sm:text-6xl font-serif text-white mb-4 leading-tight">
          {wedding.coupleNames}
        </h1>

        {wedding.date && (
          <p className="text-lg text-white/75 mb-12">{wedding.date}</p>
        )}

        <div className="w-12 h-px bg-white/30 mb-12" />

        <p className="text-xs text-white/50">
          Formal invitation to follow
        </p>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce text-white/50 z-10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
