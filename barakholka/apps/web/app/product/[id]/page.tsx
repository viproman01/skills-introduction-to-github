import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Price } from '@/components/price';
import { VariantPicker, type Variant } from '@/components/variant-picker';

type ProductDetail = {
  id: string;
  title: string;
  description: string | null;
  price_kzt: number;
  condition: 'new' | 'used';
  is_wholesale: boolean;
  min_wholesale_qty: number | null;
  media: { url: string; order_idx: number; type: 'photo' | 'video' }[];
  shop: {
    id: string;
    name: string;
    row_number: string | null;
    place_number: string | null;
    sector: { code: string; floor: number; zone: { name: string } } | null;
  } | null;
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [{ data }, { data: variantData }] = await Promise.all([
    supabase
      .from('product')
      .select(
        'id, title, description, price_kzt, condition, is_wholesale, min_wholesale_qty,' +
          ' media:product_media(url, order_idx, type),' +
          ' shop:shop(id, name, row_number, place_number, sector:sector(code, floor, zone:zone(name)))',
      )
      .eq('id', id)
      .eq('is_available', true)
      .maybeSingle(),
    supabase
      .from('product_variant')
      .select('id, size, color, price_kzt, stock_qty')
      .eq('product_id', id)
      .order('created_at'),
  ]);

  if (!data) notFound();
  const product = data as unknown as ProductDetail;
  const variants = (variantData ?? []) as Variant[];

  const photos = product.media.filter((m) => m.type === 'photo').sort((a, b) => a.order_idx - b.order_idx);
  const cover = photos[0]?.url ?? null;
  const location = product.shop?.sector
    ? `${product.shop.sector.zone.name} · сектор ${product.shop.sector.code}`
    : null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          {cover ? (
            <Image src={cover} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">нет фото</div>
          )}
        </div>
        {photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 4).map((p) => (
              <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <Image src={p.url} alt="" fill className="object-cover" sizes="25vw" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            {product.condition === 'used' && (
              <span className="rounded bg-neutral-900/80 px-2 py-0.5 text-xs text-white">б/у</span>
            )}
            {product.is_wholesale && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                опт от {product.min_wholesale_qty ?? 2} шт
              </span>
            )}
          </div>
        </div>

        {variants.length > 0 ? (
          <VariantPicker variants={variants} basePrice={product.price_kzt} />
        ) : (
          <Price value={product.price_kzt} className="text-3xl font-bold" />
        )}

        {product.description && <p className="whitespace-pre-wrap text-neutral-700">{product.description}</p>}

        {product.shop && (
          <Link
            href={`/shop/${product.shop.id}`}
            className="flex flex-col gap-1 rounded-xl border border-neutral-200 p-4 transition hover:border-rose-300"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">Бутик</div>
            <div className="font-medium">{product.shop.name}</div>
            {location && <div className="text-sm text-neutral-600">{location}</div>}
          </Link>
        )}

        <form method="post" action="/api/lead" className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4">
          <div className="text-sm font-medium">Оставить заявку</div>
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="channel" value="phone" />
          <input
            name="buyer_name"
            required
            placeholder="Имя"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="buyer_phone"
            required
            placeholder="Телефон"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            name="message"
            rows={3}
            placeholder="Вопрос продавцу (необязательно)"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:bg-rose-700">
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
