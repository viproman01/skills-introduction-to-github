import Image from 'next/image';
import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatKzt } from '@/lib/format';

type Row = {
  id: string;
  title: string;
  price_kzt: number;
  is_available: boolean;
  condition: 'new' | 'used';
  shop: { id: string; name: string; seller_id: string } | null;
  media: { url: string; order_idx: number }[];
};

type SearchParams = Promise<{ shop?: string }>;

export default async function MyProducts({ searchParams }: { searchParams: SearchParams }) {
  const { shop: shopFilter } = await searchParams;
  const seller = await requireSeller('/seller/products');
  const supabase = await getSupabaseServer();

  let q = supabase
    .from('product')
    .select('id, title, price_kzt, is_available, condition, shop:shop!inner(id, name, seller_id), media:product_media(url, order_idx)')
    .eq('shop.seller_id', seller.userId)
    .order('created_at', { ascending: false });

  if (shopFilter) q = q.eq('shop_id', shopFilter);

  const { data } = await q;
  const products = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Товары</h1>
          <p className="mt-1 text-sm text-neutral-600">{products.length} позиций</p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          + Новый товар
        </Link>
      </header>

      {shopFilter && (
        <div className="inline-flex items-center gap-2 self-start rounded-md bg-brand-soft px-2.5 py-1 text-xs text-brand">
          Фильтр: бутик
          <Link href="/seller/products" className="font-medium hover:underline">
            ✕ снять
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">Пока нет товаров.</p>
          <Link
            href="/seller/products/new"
            className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
          >
            Добавить первый
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const cover = [...(p.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0]?.url ?? null;
            return (
              <li key={p.id}>
                <Link
                  href={`/seller/products/${p.id}`}
                  className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-brand hover:shadow-sm"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {cover ? (
                      <Image src={cover} alt={p.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">нет фото</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="line-clamp-2 text-sm font-medium text-neutral-900">{p.title}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{formatKzt(p.price_kzt)}</span>
                      {p.condition === 'used' && (
                        <span className="rounded bg-neutral-900/80 px-1.5 py-0.5 text-[10px] text-white">б/у</span>
                      )}
                      {!p.is_available && (
                        <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">скрыт</span>
                      )}
                    </div>
                    {p.shop && <div className="truncate text-xs text-neutral-500">{p.shop.name}</div>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
