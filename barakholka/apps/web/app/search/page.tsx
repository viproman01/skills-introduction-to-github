import { getSupabaseServer } from '@/lib/supabase/server';
import { resolveMarket } from '@/lib/market';
import { getFavoriteSet } from '@/lib/favorites';
import { ProductCard } from '@/components/product-card';
import type { ProductCardData } from '@/lib/types';

export const metadata = { title: 'Поиск — Барахолка.kz' };

type Row = {
  id: string;
  title: string;
  price_kzt: number;
  condition: 'new' | 'used';
  media: { url: string; order_idx: number }[];
  shop: { id: string; name: string } | null;
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  priceMin?: string;
  priceMax?: string;
  condition?: string;
  sort?: string;
  market?: string;
}>;

type SortKey = 'new' | 'price_asc' | 'price_desc';
const SORT_LABELS: Record<SortKey, string> = {
  new: 'Сначала новые',
  price_asc: 'Сначала дешёвые',
  price_desc: 'Сначала дорогие',
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const query = (sp.q ?? '').trim();
  const category = sp.category ?? '';
  const priceMin = numOrNull(sp.priceMin);
  const priceMax = numOrNull(sp.priceMax);
  const condition = sp.condition === 'used' || sp.condition === 'new' ? sp.condition : '';
  const sort: SortKey = sp.sort === 'price_asc' || sp.sort === 'price_desc' ? sp.sort : 'new';
  const market = await resolveMarket(sp.market);

  const supabase = await getSupabaseServer();

  const [{ data: cats }, favs] = await Promise.all([
    supabase.from('category').select('id, name_ru, slug').order('name_ru'),
    getFavoriteSet(),
  ]);
  const categories = (cats ?? []) as { id: string; name_ru: string; slug: string }[];

  const hasFilters = query || category || priceMin !== null || priceMax !== null || condition;
  const products = hasFilters ? await runSearch({ supabase, query, category, priceMin, priceMax, condition, sort, marketId: market?.id }) : [];

  const buildHref = (overrides: Partial<Record<string, string>>) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (priceMin !== null) params.set('priceMin', String(priceMin));
    if (priceMax !== null) params.set('priceMax', String(priceMax));
    if (condition) params.set('condition', condition);
    if (sort !== 'new') params.set('sort', sort);
    if (market) params.set('market', market.slug);
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === '') params.delete(k);
      else params.set(k, v);
    }
    return `/search${params.toString() ? `?${params.toString()}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Поиск</h1>

      <form method="get" className="flex flex-col gap-3">
        {market && <input type="hidden" name="market" value={market.slug} />}

        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Например: куртка мужская"
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-hover"
          >
            Найти
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select
            name="category"
            defaultValue={category}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ru}</option>
            ))}
          </select>
          <input
            name="priceMin"
            type="number"
            min="0"
            defaultValue={priceMin ?? ''}
            placeholder="Цена от, ₸"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            name="priceMax"
            type="number"
            min="0"
            defaultValue={priceMax ?? ''}
            placeholder="Цена до, ₸"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <select
            name="condition"
            defaultValue={condition}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Новый или б/у</option>
            <option value="new">Новый</option>
            <option value="used">Б/у</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Активные фильтры:</span>
            {query && <Chip href={buildHref({ q: '' })}>q: «{query}» ✕</Chip>}
            {category && <Chip href={buildHref({ category: '' })}>{categories.find((c) => c.id === category)?.name_ru ?? 'cat'} ✕</Chip>}
            {priceMin !== null && <Chip href={buildHref({ priceMin: '' })}>от {priceMin} ₸ ✕</Chip>}
            {priceMax !== null && <Chip href={buildHref({ priceMax: '' })}>до {priceMax} ₸ ✕</Chip>}
            {condition && <Chip href={buildHref({ condition: '' })}>{condition === 'used' ? 'б/у' : 'новый'} ✕</Chip>}
            <a href="/search" className="font-medium text-brand hover:underline">сбросить все</a>
          </div>
        )}
      </form>

      {!hasFilters ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Введите запрос или выберите фильтр.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          По выбранным критериям ничего не найдено.
        </div>
      ) : (
        <>
          <div className="text-sm text-neutral-500">Найдено: {products.length}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isFavorite={favs.has(p.id)}
                returnTo={buildHref({})}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function numOrNull(v: string | undefined): number | null {
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="rounded-full border border-neutral-300 px-2 py-0.5 hover:border-brand hover:text-brand">
      {children}
    </a>
  );
}

type SupabaseAny = Awaited<ReturnType<typeof getSupabaseServer>>;

async function runSearch({
  supabase,
  query,
  category,
  priceMin,
  priceMax,
  condition,
  sort,
  marketId,
}: {
  supabase: SupabaseAny;
  query: string;
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  condition: string;
  sort: SortKey;
  marketId?: string;
}): Promise<ProductCardData[]> {
  try {
    const select =
      'id, title, price_kzt, condition, media:product_media(url, order_idx),' +
      ' shop:shop!inner(id, name, sector:sector!inner(zone:zone!inner(market_id)))';

    let q = supabase.from('product').select(select).eq('is_available', true).limit(60);

    if (marketId) q = q.eq('shop.sector.zone.market_id', marketId);
    if (category) q = q.eq('category_id', category);
    if (condition === 'new' || condition === 'used') q = q.eq('condition', condition);
    if (priceMin !== null) q = q.gte('price_kzt', priceMin);
    if (priceMax !== null) q = q.lte('price_kzt', priceMax);

    if (query) {
      // FTS first, trigram fallback via ilike if empty
      const fts = await q.textSearch('title', query, { type: 'websearch', config: 'russian' });
      let rows = (fts.data ?? []) as unknown as Row[];
      if (rows.length === 0) {
        // Rebuild query because textSearch was already consumed
        let fallback = supabase.from('product').select(select).eq('is_available', true).limit(60).ilike('title', `%${query}%`);
        if (marketId) fallback = fallback.eq('shop.sector.zone.market_id', marketId);
        if (category) fallback = fallback.eq('category_id', category);
        if (condition === 'new' || condition === 'used') fallback = fallback.eq('condition', condition);
        if (priceMin !== null) fallback = fallback.gte('price_kzt', priceMin);
        if (priceMax !== null) fallback = fallback.lte('price_kzt', priceMax);
        const res = await fallback;
        rows = (res.data ?? []) as unknown as Row[];
      }
      return finish(rows, sort);
    }

    if (sort === 'price_asc') q = q.order('price_kzt', { ascending: true });
    else if (sort === 'price_desc') q = q.order('price_kzt', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    const { data } = await q;
    return finish((data ?? []) as unknown as Row[], sort);
  } catch {
    return [];
  }
}

function finish(rows: Row[], sort: SortKey): ProductCardData[] {
  const mapped = rows.map((r) => {
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
  if (sort === 'price_asc') mapped.sort((a, b) => a.price_kzt - b.price_kzt);
  if (sort === 'price_desc') mapped.sort((a, b) => b.price_kzt - a.price_kzt);
  return mapped;
}
