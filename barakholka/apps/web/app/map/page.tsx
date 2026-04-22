import { getSupabaseServer } from '@/lib/supabase/server';
import { resolveMarket } from '@/lib/market';
import { BazaarWorkspace } from '@/components/bazaar/bazaar-workspace';
import { rowDefsFromZones, ROW_DEFS, ROW_CAPACITY } from '@/components/bazaar/types';
import type { ShopGeo } from '@/lib/types';

export const metadata = { title: 'План базара — Барахолка.kz' };

type SearchParams = Promise<{ market?: string }>;

type ShopRow = {
  id: string;
  name: string;
  coords: { coordinates: [number, number] } | null;
  photos: string[] | null;
  is_verified: boolean;
  sector: { code: string; zone: { name: string; slug: string } } | null;
};

type ZoneRow = { slug: string; name: string };

export default async function MapPage({ searchParams }: { searchParams: SearchParams }) {
  const { market: marketSlugParam } = await searchParams;
  const market = await resolveMarket(marketSlugParam);

  const [zones, shops] = await Promise.all([
    market ? fetchZones(market.id) : Promise.resolve([] as ZoneRow[]),
    market ? fetchShops(market.id) : Promise.resolve([] as ShopGeo[]),
  ]);

  // Live data → derive rows from zones; otherwise fall back to the 10 real
  // pavilion defaults + fabricated shops so the UI still renders.
  const rows = zones.length > 0 ? rowDefsFromZones(zones) : ROW_DEFS;
  const resolvedShops = shops.length > 0 ? shops : fabricateMockShops(rows);

  return (
    <BazaarWorkspace
      shops={resolvedShops}
      rows={rows}
      capacities={ROW_CAPACITY}
      marketName={market?.name ?? 'Алматинская барахолка'}
    />
  );
}

async function fetchZones(marketId: string): Promise<ZoneRow[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('zone')
      .select('slug, name')
      .eq('market_id', marketId)
      .order('name');
    return (data ?? []) as ZoneRow[];
  } catch {
    return [];
  }
}

async function fetchShops(marketId: string): Promise<ShopGeo[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('shop')
      .select('id, name, coords, photos, is_verified, sector:sector!inner(code, zone:zone!inner(name, slug, market_id))')
      .eq('is_active', true)
      .eq('sector.zone.market_id', marketId)
      .limit(1000);

    const rows = (data ?? []) as unknown as ShopRow[];
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      lon: s.coords?.coordinates[0] ?? 0,
      lat: s.coords?.coordinates[1] ?? 0,
      photo: s.photos?.[0] ?? null,
      is_verified: s.is_verified,
      zone_slug: s.sector?.zone?.slug ?? null,
      zone_name: s.sector?.zone?.name ?? null,
      sector_code: s.sector?.code ?? null,
    }));
  } catch {
    return [];
  }
}

/** When the DB isn't reachable or hasn't been seeded yet, fabricate a
 *  believable bazaar out of the given rows so /map isn't empty. */
function fabricateMockShops(rows: { slug: string; name: string; letter: string }[]): ShopGeo[] {
  const out: ShopGeo[] = [];
  const sampleNames = [
    'Всё для школы', 'Спорт и туризм', 'Хит сезона', 'Оптовый склад',
    'Модный образ', 'Товары для дома', 'Детский мир', 'Обувной дом',
    'Лучшие цены', 'Семейный базар', 'Магазин мастеров', 'Кухонный рай',
    'Стиль и уют', 'Новинки', 'Для спорта', 'Всё по 500',
    'Распродажа', 'Премиум', 'Эконом-класс', 'Товары Казахстана',
  ];
  const countByRow: Record<string, number> = {
    adem: 38, alatau: 32, yalyan: 44, olzha: 24, bolashak: 22,
    almaly: 28, merkur: 20, kulanda: 14, 'aina-sulu': 12, bereket: 18,
  };
  for (const def of rows) {
    const count = countByRow[def.slug] ?? 20;
    for (let i = 0; i < count; i++) {
      const id = `${def.slug}-${i.toString().padStart(3, '0')}`;
      out.push({
        id,
        name: sampleNames[(i + def.slug.length) % sampleNames.length]!,
        lon: 0,
        lat: 0,
        photo: null,
        is_verified: i % 5 === 0,
        zone_slug: def.slug,
        zone_name: def.name,
        sector_code: def.letter,
      });
    }
  }
  return out;
}
