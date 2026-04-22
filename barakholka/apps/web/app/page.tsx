import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { resolveMarket } from '@/lib/market';
import { ShopCard } from '@/components/shop-card';
import { ProductCard } from '@/components/product-card';
import type { ProductCardData, ShopSummary } from '@/lib/types';

type SearchParams = Promise<{ market?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { market: marketSlugParam } = await searchParams;
  const market = await resolveMarket(marketSlugParam);
  const [popularShops, recommended] = await Promise.all([
    fetchPopularShops(market?.id),
    fetchRecommended(market?.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero promo */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-blue-700 p-6 text-white md:p-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide">
              до −80%
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              Барахолка Алматы.
              <br />
              Опт и розница в одном месте.
            </h1>
            <p className="mt-3 max-w-md text-white/85">
              Тысячи магазинов с рынка — на карте, в каталоге и в поиске. Связывайся с продавцом напрямую.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/shops"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-neutral-100"
              >
                Перейти в каталог
              </Link>
              <Link
                href="/map"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Открыть карту
              </Link>
            </div>
          </div>
          <div className="hidden md:block" aria-hidden>
            <div className="ml-auto grid h-44 w-full max-w-md grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/15 backdrop-blur"
                  style={{ aspectRatio: '1' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick category strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/search?q=одежда',     emoji: '👕', label: 'Одежда' },
          { href: '/search?q=обувь',      emoji: '👟', label: 'Обувь' },
          { href: '/search?q=аксессуары', emoji: '👜', label: 'Аксессуары' },
          { href: '/search?q=детям',      emoji: '🧸', label: 'Детям' },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-card transition hover:shadow-cardHover"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-sm font-medium">{c.label}</span>
          </Link>
        ))}
      </section>

      {/* Recommended products */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Рекомендуем</h2>
          <Link href="/search" className="text-sm font-medium text-brand hover:underline">
            все товары →
          </Link>
        </div>
        {recommended.length === 0 ? (
          <EmptyState text="Запусти `pnpm seed`, чтобы заполнить базу." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Popular shops */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Популярные магазины</h2>
          <Link href="/shops" className="text-sm font-medium text-brand hover:underline">
            все магазины →
          </Link>
        </div>
        {popularShops.length === 0 ? (
          <EmptyState text="Магазины появятся после сидинга." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularShops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}

async function fetchPopularShops(marketId?: string): Promise<ShopSummary[]> {
  try {
    const supabase = await getSupabaseServer();
    let q = supabase
      .from('shop')
      .select(
        'id, name, row_number, place_number, photos, is_verified,' +
          ' sector:sector!inner(code, floor, zone:zone!inner(name, slug, market_id))',
      )
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .limit(8);
    if (marketId) q = q.eq('sector.zone.market_id', marketId);
    const { data } = await q;
    return (data ?? []) as unknown as ShopSummary[];
  } catch {
    return [];
  }
}

type Row = {
  id: string;
  title: string;
  price_kzt: number;
  condition: 'new' | 'used';
  media: { url: string; order_idx: number }[];
  shop: { id: string; name: string } | null;
};

async function fetchRecommended(marketId?: string): Promise<ProductCardData[]> {
  try {
    const supabase = await getSupabaseServer();
    let q = supabase
      .from('product')
      .select(
        'id, title, price_kzt, condition, media:product_media(url, order_idx),' +
          ' shop:shop!inner(id, name, sector:sector!inner(zone:zone!inner(market_id)))',
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(10);
    if (marketId) q = q.eq('shop.sector.zone.market_id', marketId);
    const { data } = await q;

    return ((data ?? []) as unknown as Row[]).map((r) => {
      const firstMedia = [...(r.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0];
      return {
        id: r.id,
        title: r.title,
        price_kzt: r.price_kzt,
        condition: r.condition,
        photo: firstMedia?.url ?? null,
        shop: r.shop,
      };
    });
  } catch {
    return [];
  }
}
