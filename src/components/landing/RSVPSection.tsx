import Link from 'next/link';

export default function RSVPSection() {
  return (
    <section id="rsvp" className="py-24 px-6 bg-white text-center">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-6">
          You&rsquo;re Invited
        </p>

        <p className="text-stone-500 text-sm mb-10 leading-relaxed">
          Please let us know if you can make it. It would mean the world to have you celebrate with us.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center h-12 px-10 bg-stone-800 text-white text-sm tracking-wide rounded-full hover:bg-stone-700 active:bg-stone-900 transition-colors"
        >
          RSVP
        </Link>
      </div>
    </section>
  );
}
