import type { HeroContent } from '@/config/heroVariants';

interface HeroSectionProps {
  content: HeroContent;
}

export default function HeroSection({ content }: HeroSectionProps) {

  return (
    <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6">
          {content.tagline}
        </p>

        <h1 className="text-5xl sm:text-6xl font-serif text-white mb-4 leading-tight">
          {content.heading}
        </h1>

        <p className="text-m text-white/75 mb-12 whitespace-pre-line">{content.subheading}</p>

      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce text-white/50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
