import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { ProductCard } from '@/components/product-card';
import { RatingStars } from '@/components/rating-stars';
import { ReviewForm } from '@/components/review-form';
import { submitReview } from './review-actions';
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

type SectionRef = { id: string; name: string; slug: string; order_idx: number };

type ProductRow = {
  id: string;
  title: string;
  price_kzt: number;
  condition: 'new' | 'used';
  section_id: string | null;
  media: { url: string; order_idx: number }[];
};

type ReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  buyer_id: string;
};

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { id } = await params;
  const { review } = await searchParams;
  const supabase = await getSupabaseServer();
  const user = await getCurrentUser();

  const [{ data: shopData }, { data: sectionsData }, { data: productsData }, { data: reviewsData }] = await Promise.all([
    supabase
      .from('shop')
      .select(
        'id, name, description, row_number, place_number, photos, is_verified, hours,' +
          ' sector:sector(code, floor, zone:zone(name))',
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('shop_section')
      .select('id, name, slug, order_idx')
      .eq('shop_id', id)
      .eq('is_visible', true)
      .order('order_idx'),
    supabase
      .from('product')
      .select('id, title, price_kzt, condition, section_id, media:product_media(url, order_idx)')
      .eq('shop_id', id)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('review')
      .select('id, rating, text, created_at, buyer_id')
      .eq('shop_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!shopData) notFound();
  const shop = shopData as unknown as ShopDetail;
  const sections = (sectionsData ?? []) as SectionRef[];
  const rows = (productsData ?? []) as unknown as ProductRow[];
  const reviews = (reviewsData ?? []) as ReviewRow[];

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const myReview = user ? reviews.find((r) => r.buyer_id === user.id) ?? null : null;
  const boundSubmit = submitReview.bind(null, id);

  const toCard = (r: ProductRow): ProductCardData => {
    const firstMedia = [...(r.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0];
    return {
      id: r.id,
      title: r.title,
      price_kzt: r.price_kzt,
      condition: r.condition,
      photo: firstMedia?.url ?? null,
      shop: { id: shop.id, name: shop.name },
    };
  };

  const bySection = new Map<string, ProductRow[]>();
  const unsectioned: ProductRow[] = [];
  for (const r of rows) {
    if (r.section_id) {
      if (!bySection.has(r.section_id)) bySection.set(r.section_id, []);
      bySection.get(r.section_id)!.push(r);
    } else {
      unsectioned.push(r);
    }
  }

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
            {reviews.length > 0 && (
              <a href="#reviews" className="mt-1 inline-flex items-center gap-1.5 text-sm hover:underline">
                <RatingStars value={avgRating} />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-neutral-500">· {reviews.length} отзывов</span>
              </a>
            )}
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
        </div>
      </section>

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          У бутика пока нет товаров.
        </div>
      )}

      {sections.map((section) => {
        const items = bySection.get(section.id) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={section.id} id={`section-${section.slug}`}>
            <h2 className="mb-4 text-xl font-semibold">{section.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={toCard(p)} />
              ))}
            </div>
          </section>
        );
      })}

      {unsectioned.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            {sections.length > 0 ? 'Остальное' : 'Товары'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {unsectioned.map((p) => (
              <ProductCard key={p.id} product={toCard(p)} />
            ))}
          </div>
        </section>
      )}

      <section id="reviews" className="border-t border-neutral-200 pt-8">
        <h2 className="mb-1 text-xl font-semibold">Отзывы</h2>
        {reviews.length > 0 && (
          <div className="mb-4 flex items-baseline gap-2">
            <RatingStars value={avgRating} size={18} />
            <span className="text-xl font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-neutral-500">· {reviews.length} {plural(reviews.length, 'отзыв', 'отзыва', 'отзывов')}</span>
          </div>
        )}

        {review === 'ok' && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            Спасибо за отзыв!
          </div>
        )}
        {review === 'rating' && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Укажите оценку от 1 до 5.
          </div>
        )}

        {user ? (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium">
              {myReview ? 'Ваш отзыв (можно обновить)' : 'Оставить отзыв'}
            </h3>
            <ReviewForm
              action={boundSubmit}
              initialRating={myReview?.rating ?? 0}
              initialText={myReview?.text ?? ''}
            />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            <Link href={`/login?next=/shop/${shop.id}`} className="font-medium text-brand hover:underline">
              Войдите
            </Link>
            , чтобы оставить отзыв.
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">Пока нет отзывов. Будьте первым.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <RatingStars value={r.rating} size={12} />
                  <span>{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                  {user?.id === r.buyer_id && (
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">ваш</span>
                  )}
                </div>
                {r.text && <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{r.text}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
