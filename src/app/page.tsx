import type { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';

export const metadata: Metadata = {
  title: `Save the Date — ${process.env.NEXT_PUBLIC_COUPLE_NAMES ?? 'Our Wedding'}`,
  description: 'You are invited. Mark your calendar.',
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
