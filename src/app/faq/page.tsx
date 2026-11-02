import type { Metadata } from 'next';
import { brideCoupleName, groomCoupleName, indianEvent, receptionEvent } from '@/config/wedding';
import { heroVariants } from '@/config/heroVariants';
import { INVITE_MODE_PARAM, RECEPTION_MODE } from '@/lib/constants';
import NavMenu, { type NavLink } from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import EventSection from '@/components/landing/EventSection';
import FAQSection from '@/components/landing/FAQSection';

type SearchParams = Promise<Record<string, string | undefined>>;

const navLinks: NavLink[] = [
  { label: 'Home', href: '#hero' },
  { label: 'Venue & Date', href: '#venue' },
  { label: 'FAQ', href: '#faq' },
];

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const isReception = params[INVITE_MODE_PARAM] === RECEPTION_MODE;
  return {
    title: isReception ? groomCoupleName : brideCoupleName,
    description: 'FAQ',
  };
}

export default async function FAQPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const isReception = params[INVITE_MODE_PARAM] === RECEPTION_MODE;
  const coupleNames = isReception ? groomCoupleName : brideCoupleName;

  return (
    <main>
      <ScrollBackground />
      <NavMenu links={navLinks} />
      <HeroSection content={isReception ? heroVariants.faqReception : heroVariants.faq} />
      {!isReception && (
        <EventSection event={indianEvent} coupleNames={coupleNames} sectionLabel="Venue & Date" />
      )}
      <EventSection event={receptionEvent} coupleNames={coupleNames} sectionLabel={isReception ? 'Venue & Date' : undefined} />
      <FAQSection mode={isReception ? RECEPTION_MODE : undefined} />
    </main>
  );
}
