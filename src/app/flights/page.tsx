import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findGuestByPhone, findFlightByPhone } from '@/lib/sheets';
import { FLIGHTS_MODE, loginHref } from '@/lib/constants';
import { ui } from '@/lib/ui';
import PersonalizedHeader from '@/components/invite/PersonalizedHeader';
import FlightsForm from '@/components/flights/FlightsForm';

export default async function FlightsPage() {
  const session = await getSession();
  if (!session) {
    redirect(loginHref(FLIGHTS_MODE));
  }

  const guest = await findGuestByPhone(session.phone);
  if (!guest) {
    redirect(loginHref(FLIGHTS_MODE));
  }

  const existingFlight = await findFlightByPhone(session.phone);

  return (
    <main className="min-h-screen relative">
      <div className="fixed top-0 left-0 w-full -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')", height: '100lvh' }} />
      <div className={`fixed top-0 left-0 w-full -z-10 ${ui.overlay}`} style={{ height: '100lvh' }} />
      <PersonalizedHeader name={guest.name} />
      <FlightsForm existingFlight={existingFlight} existingEmail={guest.email} />
    </main>
  );
}
