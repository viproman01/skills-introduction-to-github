import Image from 'next/image';
import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

export default async function MyShops() {
  const seller = await requireSeller('/seller/shops');
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('shop')
    .select('id, name, description, photos, is_active, row_number, place_number, sector:sector(code, zone:zone(name))')
    .eq('seller_id', seller.userId)
    .order('created_at', { ascending: false });

  type Row = {
    id: string;
    name: string;
    description: string | null;
    photos: string[];
    is_active: boolean;
    row_number: string | null;
    place_number: string | null;
    sector: { code: string; zone: { name: string } | null } | null;
  };
  const shops = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Мои бутики</h1>
          <p className="mt-1 text-sm text-neutral-600">{shops.length} {shopsPlural(shops.length)}</p>
        </div>
        <Link
          href="/seller/shops/new"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          + Новый бутик
        </Link>
      </header>

      {shops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">Пока нет ни одного бутика.</p>
          <Link
            href="/seller/shops/new"
            className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
          >
            Открыть первый
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link
                href={`/seller/shops/${shop.id}`}
                className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-brand hover:shadow-sm"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {shop.photos[0] ? (
                    <Image src={shop.photos[0]} alt={shop.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">нет фото</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-neutral-900">{shop.name}</span>
                    {!shop.is_active && (
                      <span className="shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                        скрыт
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-neutral-500">
                    {shop.sector?.zone?.name ?? 'Без ряда'}
                    {shop.sector?.code && <> · сектор {shop.sector.code}</>}
                    {shop.place_number && <> · место {shop.place_number}</>}
                  </div>
                  {shop.description && (
                    <div className="line-clamp-1 text-xs text-neutral-600">{shop.description}</div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shopsPlural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'бутик';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'бутика';
  return 'бутиков';
}
