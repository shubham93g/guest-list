import type { Metadata } from 'next';
import { wedding } from '@/config/wedding';
import NavMenu from '@/components/landing/NavMenu';
import HeroSection from '@/components/landing/HeroSection';
import VenueSection from '@/components/landing/VenueSection';
import FAQSection from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: `Save the Date — ${wedding.coupleNames}`,
  description: 'You are invited. Mark your calendar.',
};

export default function HomePage() {
  return (
    <main>
      <NavMenu />
      <HeroSection />
      <VenueSection />
      <FAQSection />
    </main>
  );
}
