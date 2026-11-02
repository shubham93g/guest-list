import type { Metadata } from 'next';
import { brideCoupleName, groomCoupleName } from '@/config/wedding';
import { heroVariants } from '@/config/heroVariants';
import { INVITE_MODE_PARAM, RECEPTION_MODE } from '@/lib/constants';
import NavMenu, { type NavLink } from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import FAQSection from '@/components/landing/FAQSection';

type SearchParams = Promise<Record<string, string | undefined>>;

const navLinks: NavLink[] = [
  { label: 'Home', href: '#hero' },
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

  return (
    <main>
      <ScrollBackground revealSectionId="faq" />
      <NavMenu links={navLinks} />
      <HeroSection content={isReception ? heroVariants.faqReception : heroVariants.faq} />
      <FAQSection mode={isReception ? RECEPTION_MODE : undefined} />
    </main>
  );
}
