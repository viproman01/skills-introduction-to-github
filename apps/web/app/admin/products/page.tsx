import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatKzt } from '@/lib/format';
import { setProductAvailable } from '../actions';

type Row = {
  id: string;
  title: string;
  price_kzt: number;
  is_available: boolean;
  condition: 'new' | 'used';
  created_at: string;
  shop: { id: string; name: string } | null;
  media: { url: string; order_idx: number }[];
};

type SearchParams = Promise<{ filter?: 'all' | 'available' | 'hidden' }>;

export default async function AdminProducts({ searchParams }: { searchParams: SearchParams }) {
  const { filter = 'all' } = await searchParams;
  const supabase = await getSupabaseServer();

  let q = supabase
    .from('product')
    .select('id, title, price_kzt, is_available, condition, created_at, shop:shop(id, name), media:product_media(url, order_idx)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter === 'available') q = q.eq('is_available', true);
  if (filter === 'hidden') q = q.eq('is_available', false);

  const { data } = await q;
  const products = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Товары</h1>
        <nav className="mt-2 flex flex-wrap gap-2 text-sm">
          <FilterLink href="/admin/products?filter=all"       active={filter === 'all'}>Все</FilterLink>
          <FilterLink href="/admin/products?filter=available" active={filter === 'available'}>В наличии</FilterLink>
          <FilterLink href="/admin/products?filter=hidden"    active={filter === 'hidden'}>Скрытые</FilterLink>
        </nav>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Ничего не найдено.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p) => {
            const cover = [...(p.media ?? [])].sort((a, b) => a.order_idx - b.order_idx)[0]?.url ?? null;
            const toggle = setProductAvailable.bind(null, p.id, !p.is_available);
            return (
              <li key={p.id} className="flex items-stretch gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {cover ? (
                    <Image src={cover} alt={p.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">нет фото</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/product/${p.id}`} target="_blank" className="line-clamp-1 font-medium hover:text-brand">
                      {p.title}
                    </Link>
                    {p.condition === 'used' && <span className="rounded bg-neutral-900/80 px-1.5 py-0.5 text-[10px] text-white">б/у</span>}
                    {!p.is_available && <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">скрыт</span>}
                  </div>
                  <div className="text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-800">{formatKzt(p.price_kzt)}</span>
                    {p.shop && <> · {p.shop.name}</>}
                  </div>
                  <div className="text-xs text-neutral-400">{new Date(p.created_at).toLocaleString('ru-RU')}</div>
                </div>
                <form action={toggle} className="flex shrink-0 items-center">
                  <button
                    type="submit"
                    className={[
                      'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                      p.is_available
                        ? 'border border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-700'
                        : 'bg-brand text-brand-fg hover:bg-brand-hover',
                    ].join(' ')}
                  >
                    {p.is_available ? 'Скрыть' : 'Вернуть'}
                  </button>
                </form>
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
