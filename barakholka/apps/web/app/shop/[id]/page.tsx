import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product-card';
import type { ProductCardData } from '@/lib/types';

type ShopDetail = {
  id: string;
  name: string;
  description: string | null;
  row_number: string | null;
  place_number: string | null;
  photos: string[];
  is_verified: boolean;
  hours: Record<string, string> | null;
  sector: { code: string; floor: number; zone: { name: string } } | null;
};

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [{ data: shopData }, { data: productsData }] = await Promise.all([
    supabase
      .from('shop')
      .select(
        'id, name, description, row_number, place_number, photos, is_verified, hours, sector:sector(code, floor, zone:zone(name))',
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('product')
      .select('id, title, price_kzt, condition, media:product_media(url, order_idx)')
      .eq('shop_id', id)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(48),
  ]);

  if (!shopData) notFound();
  const shop = shopData as unknown as ShopDetail;

  type Row = { id: string; title: string; price_kzt: number; condition: 'new' | 'used'; media: { url: string; order_idx: number }[] };
  const products: ProductCardData[] = (productsData ?? []).map((p) => {
    const row = p as unknown as Row;
    const firstMedia = [...(row.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0];
    return {
      id: row.id,
      title: row.title,
      price_kzt: row.price_kzt,
      condition: row.condition,
      photo: firstMedia?.url ?? null,
      shop: { id: shop.id, name: shop.name },
    };
  });

  const location = shop.sector
    ? `${shop.sector.zone.name} · сектор ${shop.sector.code}${shop.sector.floor > 1 ? `, ${shop.sector.floor} эт.` : ''}`
    : 'Локация уточняется';

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
          {shop.photos[0] ? (
            <Image src={shop.photos[0]} alt={shop.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">нет фото</div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{shop.name}</h1>
              {shop.is_verified && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-brand-fg">проверен</span>
              )}
            </div>
            <div className="mt-1 text-sm text-neutral-600">{location}</div>
            {(shop.row_number || shop.place_number) && (
              <div className="text-sm text-neutral-500">
                {shop.row_number && <>ряд {shop.row_number}</>} {shop.place_number && <>· место {shop.place_number}</>}
              </div>
            )}
          </div>
          {shop.description && <p className="text-neutral-700">{shop.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:bg-rose-700">
              WhatsApp
            </button>
            <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-neutral-500">
              Telegram
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Контакты продавца появятся после подключения seller-auth (следующая итерация).
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Товары</h2>
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            У магазина пока нет товаров.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
