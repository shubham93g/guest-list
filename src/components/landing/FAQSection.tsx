import { RECEPTION_MODE, inviteHref } from '@/lib/constants';
import { ui } from '@/lib/ui';
import { indianEvent, receptionEvent } from '@/config/wedding';

interface FAQLink {
  href: string;
  label: string;
  note?: string;
}

interface FAQ {
  q: string;
  a: string;
  links?: FAQLink[];
}

interface FAQGroup {
  // Each entry renders on its own line.
  heading: string[];
  items: FAQ[];
}

const indianFaqs: FAQGroup = {
  heading: [`${indianEvent.day}, ${indianEvent.date}`, indianEvent.title],
  items: [
    {
      q: 'What time should I arrive?',
      a: `Please arrive by 11am and be seated by 11:45am.
    We expect to finish by 3pm.`,
    },
    {
      q: 'What happens on the day?',
      a: `This is our Indian wedding, a traditional religious ceremony.
    Part of the ceremony is outdoors, as it's performed around a fire, but the whole area is fully sheltered. Lunch is a buffet, served indoors.`,
    },
    {
      q: 'What is the dress code?',
      a: `Smart formal, or traditional Indian or Burmese dress.
    If you're planning to wear Indian clothes on just one of the two days, this is the day for it!
    There are no colours to avoid.

    If you'd like tips, just ask!`,
    },
    {
      q: 'Is there parking available?',
      a: `Parking is available at the public car park at the Singapore Flyer.
    We're unable to provide parking coupons for this day.`,
    },
  ],
};

const receptionFaqs: FAQGroup = {
  heading: [`${receptionEvent.day}, ${receptionEvent.date}`, receptionEvent.title],
  items: [
    {
      q: 'What time should I arrive?',
      a: `Please arrive by 11am for registration and cocktails, and be seated by 11:45am.
    We expect to finish by 3pm.`,
    },
    {
      q: 'What happens on the day?',
      a: `This is our wedding reception, celebrating both our Burmese and Indian cultures.
    Everything is indoors, in the Fullerton Ballroom. Lunch is a buffet. Come ready to dance!`,
    },
    {
      q: 'What is the dress code?',
      a: `Smart formal, or traditional Indian or Burmese dress.

    If you'd like tips, just ask!`,
    },
    {
      q: 'Is there parking available?',
      a: `Parking is available at One Fullerton, 1 Fullerton Road.
    Please indicate in the RSVP form if you need a parking coupon.

    From the car park, it's a 5 to 10 minute walk to the hotel through a vehicle tunnel and an air-conditioned walkway.`,
    },
    {
      q: 'How do I get to the Fullerton Ballroom?',
      a: 'The Ballroom at The Fullerton Hotel Singapore is located on the Basement Level, accessible via the main hotel lifts or the grand staircase from the lobby. You will find the registration and cocktail reception area on Basement Level. From there, the ballroom is a short flight of stairs down.\r\n\r\nIf you have any accessibility needs, feel free to let us know!',
    },
  ],
};

// Built per render because the RSVP link carries the page's mode through to /invite.
function generalFaqs(mode?: string): FAQGroup {
  return {
    heading: ['General'],
    items: [
      {
        q: 'How can I update my RSVP?',
        a: 'You can view and update your RSVP at any time by logging in with your phone number.',
        links: [{ href: inviteHref(mode), label: 'Update my RSVP' }],
      },
      {
        q: 'Where can I buy Indian clothes in Singapore?',
        a: `There are lots of options! Here are a few places to start.
    If you're heading to Little India, keep in mind it gets very crowded on Sundays.

    If you haven't worn a saree before, we'd only suggest one if someone who knows how to drape it can help you get ready.`,
        links: [
          {
            href: 'https://thehoneycombers.com/singapore/deepavali-shopping-indian-clothes-singapore/',
            label: 'Honeycombers',
            note: 'a big list of shops',
          },
          {
            href: 'https://share.google/aD9r5NXUGDgQ8fmMc',
            label: 'For Desi By Desi',
            note: "great if you're looking for Indian jewellery",
          },
          { href: 'https://share.google/PaJ5YpPNdEmTszveC', label: 'The Fashion Silk' },
          { href: 'https://share.google/3AFnGtBmNHreVd5G2', label: 'Jinders' },
          {
            href: 'https://www.tekkaplace.sg/store-directories/?search=&type=40&lvl=&alphabet=',
            label: 'Tekka Place',
            note: 'lots of stores in one place',
          },
          { href: 'https://share.google/k6LjNhmnYDSE0Fmdq', label: 'Fabindia, VivoCity' },
        ],
      },
    ],
  };
}

const linkClass = 'text-white underline underline-offset-4 hover:text-white/70 transition-colors';

// Turns every "RSVP form" mention in an answer into a link to the guest's invite.
function linkRsvpMentions(text: string, href: string) {
  return text.split(/(RSVP form)/i).map((part, i) => {
    if (part.toLowerCase() !== 'rsvp form') {
      return part;
    }
    return (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {part}
      </a>
    );
  });
}

interface Props {
  mode?: string;
}

export default function FAQSection({ mode }: Props = {}) {
  const dayGroups = mode === RECEPTION_MODE ? [receptionFaqs] : [indianFaqs, receptionFaqs];
  const groups = [generalFaqs(mode), ...dayGroups];
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white mb-10 text-center">
          FAQ
        </p>

        <div className="space-y-10">
          {groups.map(({ heading, items }) => (
            <div key={heading.join()}>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-4 text-center space-y-1">
                {heading.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </p>
              <div className={ui.glassCard}>
                {items.map(({ q, a, links }) => (
                  <details key={q} className="group border-b border-white/10 last:border-b-0">
                    <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-6 py-4 cursor-pointer select-none gap-4 hover:bg-white/5 transition-colors">
                      <span className="text-sm font-medium text-white">{q}</span>
                      <span className="flex-shrink-0 flex items-center text-white">
                        <span className="group-open:hidden text-lg leading-none">+</span>
                        <span className="hidden group-open:flex text-lg leading-none">−</span>
                      </span>
                    </summary>
                    <div className="border-t border-white/10 px-6 py-4">
                      <p className="text-sm text-white leading-relaxed whitespace-pre-line">{linkRsvpMentions(a, inviteHref(mode))}</p>
                      {links && (
                        <ul className="mt-3 space-y-2 text-sm text-white">
                          {links.map(({ href, label, note }) => (
                            <li key={href}>
                              <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                {label}
                              </a>
                              {note && <span className="text-white/70">, {note}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
