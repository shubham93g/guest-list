import { brideCoupleName } from '@/config/wedding';

interface Props {
  name: string;
}

export default function PersonalizedHeader({ name }: Props) {
  return (
    <div className="text-center px-6 pt-12 pb-8">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6">
        Dear {name || 'guest'},
      </p>

      <h1 className="text-4xl sm:text-5xl font-serif text-white mb-3">
        {brideCoupleName}
      </h1>

      <p className="text-white/70 text-sm">
        request the pleasure of your company
      </p>
    </div>
  );
}
