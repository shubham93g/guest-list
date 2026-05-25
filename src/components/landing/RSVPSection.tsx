import Link from 'next/link';

export default function RSVPSection() {
  return (
    <section id="rsvp" className="py-24 px-6 text-center">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6">
          You&rsquo;re Invited
        </p>

        <p className="text-white/75 text-sm mb-10 leading-relaxed">
          Please let us know if you can make it. It would mean the world to have you celebrate with us.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center h-12 px-10 bg-white text-stone-800 text-sm tracking-wide font-medium rounded-full border border-white/60 hover:bg-stone-50 active:bg-stone-100 transition-colors"
        >
          RSVP
        </Link>
      </div>
    </section>
  );
}
