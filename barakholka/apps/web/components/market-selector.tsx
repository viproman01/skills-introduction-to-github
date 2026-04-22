import Link from 'next/link';
import { listMarkets } from '@/lib/market';

/**
 * Minimal market switcher — lists available markets and visually marks the
 * current one. Rendered server-side; URL drives active state.
 */
export async function MarketSelector({ currentSlug }: { currentSlug?: string }) {
  const markets = await listMarkets();
  if (markets.length <= 1) return null;

  const active = markets.find((m) => m.slug === currentSlug) ?? markets[0]!;

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="text-neutral-500">Рынок:</span>
      <div className="flex gap-1">
        {markets.map((m) => (
          <Link
            key={m.slug}
            href={`/?market=${m.slug}`}
            className={[
              'rounded-md border px-2 py-0.5 transition',
              m.slug === active.slug
                ? 'border-brand bg-brand text-brand-fg'
                : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
            ].join(' ')}
          >
            {m.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
