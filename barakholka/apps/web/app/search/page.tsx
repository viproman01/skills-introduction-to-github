import { getSupabaseServer } from '@/lib/supabase/server';
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

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const products = query ? await search(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Поиск</h1>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Например: куртка мужская"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:bg-rose-700">
          Найти
        </button>
      </form>

      {query === '' ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          Введите запрос, чтобы найти товар.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          По запросу <b>«{query}»</b> ничего не найдено.
        </div>
      ) : (
        <>
          <div className="text-sm text-neutral-500">
            найдено: {products.length} · запрос: <b>«{query}»</b>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

async function search(query: string): Promise<ProductCardData[]> {
  try {
    const supabase = await getSupabaseServer();
    const select = 'id, title, price_kzt, condition, media:product_media(url, order_idx), shop:shop(id, name)';

    const fts = await supabase
      .from('product')
      .select(select)
      .eq('is_available', true)
      .textSearch('title', query, { type: 'websearch', config: 'russian' })
      .limit(48);

    let rows: Row[] = (fts.data ?? []) as unknown as Row[];
    if (rows.length === 0) {
      const trgm = await supabase
        .from('product')
        .select(select)
        .eq('is_available', true)
        .ilike('title', `%${query}%`)
        .limit(48);
      rows = (trgm.data ?? []) as unknown as Row[];
    }

    return rows.map((r) => {
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
