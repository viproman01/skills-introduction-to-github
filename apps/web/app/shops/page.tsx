import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { resolveMarket } from '@/lib/market';
import { ShopCard } from '@/components/shop-card';
import type { ShopSummary } from '@/lib/types';

export const metadata = { title: 'Бутики — Барахолка.kz' };

type Zone = { name: string; slug: string };
type SearchParams = Promise<{ zone?: string; market?: string }>;

export default async function ShopsPage({ searchParams }: { searchParams: SearchParams }) {
  const { zone, market: marketSlugParam } = await searchParams;
  const market = await resolveMarket(marketSlugParam);
  const supabase = await getSupabaseServer();

  const [zonesRes, shopsRes] = await Promise.all([
    market
      ? supabase.from('zone').select('name, slug').eq('market_id', market.id).order('name')
      : Promise.resolve({ data: [] }),
    shopsQuery(supabase, zone, market?.id),
  ]);

  const zones = (zonesRes.data ?? []) as Zone[];
  const shops = (shopsRes.data ?? []) as unknown as ShopSummary[];
  const marketQS = market ? `?market=${market.slug}` : '';
  const joinQS = (extra: string) => {
    const parts: string[] = [];
    if (market) parts.push(`market=${market.slug}`);
    if (extra) parts.push(extra);
    return parts.length ? `?${parts.join('&')}` : '';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Бутики {market && <span className="text-base text-neutral-500">· {market.name}</span>}</h1>
        <div className="text-sm text-neutral-500">{shops.length} найдено</div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href={`/shops${marketQS}`} className={pill(!zone)}>
          Все павильоны
        </Link>
        {zones.map((z) => (
          <Link key={z.slug} href={`/shops${joinQS(`zone=${z.slug}`)}`} className={pill(zone === z.slug)}>
            {z.name}
          </Link>
        ))}
      </nav>

      {shops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          По выбранным фильтрам ничего не найдено.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shops.map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      )}
    </div>
  );
}

type SupabaseAny = Awaited<ReturnType<typeof getSupabaseServer>>;

async function shopsQuery(supabase: SupabaseAny, zoneSlug?: string, marketId?: string) {
  let q = supabase
    .from('shop')
    .select(
      'id, name, row_number, place_number, photos, is_verified,' +
        ' sector:sector!inner(code, floor, zone:zone!inner(name, slug, market_id))',
    )
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .limit(48);

  if (marketId) q = q.eq('sector.zone.market_id', marketId);
  if (zoneSlug) q = q.eq('sector.zone.slug', zoneSlug);
  return q;
}

function pill(active: boolean): string {
  return [
    'rounded-full border px-3 py-1 transition',
    active ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
  ].join(' ');
}
