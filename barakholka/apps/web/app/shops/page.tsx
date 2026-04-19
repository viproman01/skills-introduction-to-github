import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ShopCard } from '@/components/shop-card';
import type { ShopSummary } from '@/lib/types';

export const metadata = { title: 'Магазины — Барахолка.kz' };

type Zone = { name: string; slug: string };

export default async function ShopsPage({ searchParams }: { searchParams: Promise<{ zone?: string }> }) {
  const { zone } = await searchParams;
  const supabase = await getSupabaseServer();

  const [zonesRes, shopsRes] = await Promise.all([
    supabase.from('zone').select('name, slug').order('name'),
    shopsQuery(supabase, zone),
  ]);

  const zones = (zonesRes.data ?? []) as Zone[];
  const shops = (shopsRes.data ?? []) as unknown as ShopSummary[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Магазины</h1>
        <div className="text-sm text-neutral-500">{shops.length} найдено</div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/shops"
          className={pill(!zone)}
        >
          Все зоны
        </Link>
        {zones.map((z) => (
          <Link key={z.slug} href={`/shops?zone=${z.slug}`} className={pill(zone === z.slug)}>
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

async function shopsQuery(supabase: SupabaseAny, zoneSlug?: string) {
  let q = supabase
    .from('shop')
    .select(
      'id, name, row_number, place_number, photos, is_verified, sector:sector!inner(code, floor, zone:zone!inner(name, slug))',
    )
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .limit(48);

  if (zoneSlug) q = q.eq('sector.zone.slug', zoneSlug);
  return q;
}

function pill(active: boolean): string {
  return [
    'rounded-full border px-3 py-1 transition',
    active ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
  ].join(' ');
}
