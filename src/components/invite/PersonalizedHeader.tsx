import { wedding } from '@/config/wedding';

interface Props {
  name: string;
}

export default function PersonalizedHeader({ name }: Props) {
  const firstName = name.split(' ')[0] || 'there';

  return (
    <div className="text-center px-6 pt-12 pb-8">
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-6">
        Dear {firstName},
      </p>

      <h1 className="text-4xl sm:text-5xl font-serif text-stone-800 mb-3">
        {wedding.coupleNames}
      </h1>

      <p className="text-stone-500 mb-10 text-sm">
        request the pleasure of your company
      </p>

      <div className="max-w-xs mx-auto border border-stone-200 rounded-2xl p-6 bg-white shadow-sm space-y-3">
        <p className="text-2xl font-serif text-stone-800">{wedding.date}</p>
        {wedding.day && (
          <p className="text-sm text-stone-400 uppercase tracking-wider">{wedding.day}</p>
        )}
        {(wedding.venueName || wedding.venueCity) && (
          <>
            <div className="w-8 h-px bg-stone-200 mx-auto" />
            {wedding.venueName && (
              <p className="font-medium text-stone-700 text-sm">{wedding.venueName}</p>
            )}
            {wedding.venueCity && (
              <p className="text-xs text-stone-400">{wedding.venueCity}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
