import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findGuestByPhone } from '@/lib/sheets';
import { getEventDetails } from '@/lib/event';
import PersonalizedHeader from '@/components/invite/PersonalizedHeader';
import RSVPForm from '@/components/invite/RSVPForm';

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const guest = await findGuestByPhone(session.phone);
  const event = getEventDetails();

  if (!guest) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <PersonalizedHeader guest={guest} event={event} />
      <div className="w-16 h-px bg-stone-200 mx-auto mb-8" />
      <RSVPForm />
    </main>
  );
}
