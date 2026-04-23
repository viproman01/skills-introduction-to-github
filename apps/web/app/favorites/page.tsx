import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { ProductCard } from '@/components/product-card';
import type { ProductCardData } from '@/lib/types';

export const metadata = { title: 'Избранное — Барахолка.kz' };

type FavRow = {
  created_at: string;
  product: {
    id: string;
    title: string;
    price_kzt: number;
    condition: 'new' | 'used';
    is_available: boolean;
    media: { url: string; order_idx: number }[];
    shop: { id: string; name: string } | null;
  } | null;
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/favorites');

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('favorite')
    .select(
      'created_at, product:product(id, title, price_kzt, condition, is_available,' +
        ' media:product_media(url, order_idx), shop:shop(id, name))',
    )
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as unknown as FavRow[];
  const products: Array<ProductCardData & { id: string }> = rows
    .filter((r) => r.product?.is_available)
    .map((r) => {
      const p = r.product!;
      const firstMedia = [...(p.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0];
      return {
        id: p.id,
        title: p.title,
        price_kzt: p.price_kzt,
        condition: p.condition,
        photo: firstMedia?.url ?? null,
        shop: p.shop,
      };
    });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Избранное</h1>
          <p className="mt-1 text-sm text-neutral-600">{products.length} товаров</p>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">Вы ничего не добавили в избранное.</p>
          <Link
            href="/search"
            className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
          >
            Найти товар
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isFavorite returnTo="/favorites" />
          ))}
        </div>
      )}
    </div>
  );
}
