import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseServer } from '@/lib/supabase/server';
import { setShopActive, setShopVerified } from '../actions';

type Row = {
  id: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  photos: string[] | null;
  created_at: string;
  seller: { full_name: string | null } | null;
  sector: { code: string; zone: { name: string } | null } | null;
};

type SearchParams = Promise<{ filter?: 'all' | 'unverified' | 'hidden' }>;

export default async function AdminShops({ searchParams }: { searchParams: SearchParams }) {
  const { filter = 'unverified' } = await searchParams;
  const supabase = await getSupabaseServer();

  let q = supabase
    .from('shop')
    .select(
      'id, name, is_active, is_verified, photos, created_at,' +
        ' seller:seller(full_name),' +
        ' sector:sector(code, zone:zone(name))',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter === 'unverified') q = q.eq('is_verified', false).eq('is_active', true);
  if (filter === 'hidden') q = q.eq('is_active', false);

  const { data } = await q;
  const shops = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Бутики</h1>
        <nav className="mt-2 flex flex-wrap gap-2 text-sm">
          <FilterLink href="/admin/shops?filter=unverified" active={filter === 'unverified'}>Без отметки</FilterLink>
          <FilterLink href="/admin/shops?filter=hidden"     active={filter === 'hidden'}>Скрытые</FilterLink>
          <FilterLink href="/admin/shops?filter=all"        active={filter === 'all'}>Все</FilterLink>
        </nav>
      </header>

      {shops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          По выбранному фильтру ничего не найдено.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shops.map((shop) => {
            const verify = setShopVerified.bind(null, shop.id, !shop.is_verified);
            const toggleActive = setShopActive.bind(null, shop.id, !shop.is_active);
            return (
              <li key={shop.id} className="flex items-stretch gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {shop.photos?.[0] ? (
                    <Image src={shop.photos[0]} alt={shop.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">нет фото</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/shop/${shop.id}`} target="_blank" className="font-medium hover:text-brand">
                      {shop.name}
                    </Link>
                    {shop.is_verified && <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] text-brand-fg">проверен</span>}
                    {!shop.is_active && <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">скрыт</span>}
                  </div>
                  <div className="truncate text-xs text-neutral-500">
                    {shop.seller?.full_name ?? 'Аноним'} · {shop.sector?.zone?.name ?? 'Без ряда'}
                    {shop.sector?.code && <> · сектор {shop.sector.code}</>}
                  </div>
                  <div className="text-xs text-neutral-400">{new Date(shop.created_at).toLocaleString('ru-RU')}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={verify}>
                    <button
                      type="submit"
                      className={[
                        'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                        shop.is_verified
                          ? 'border border-neutral-300 text-neutral-700 hover:border-neutral-500'
                          : 'bg-brand text-brand-fg hover:bg-brand-hover',
                      ].join(' ')}
                    >
                      {shop.is_verified ? 'Снять отметку' : 'Проверить'}
                    </button>
                  </form>
                  <form action={toggleActive}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-red-500 hover:text-red-700"
                    >
                      {shop.is_active ? 'Скрыть' : 'Вернуть'}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        'rounded-full border px-3 py-1 text-xs transition',
        active ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
