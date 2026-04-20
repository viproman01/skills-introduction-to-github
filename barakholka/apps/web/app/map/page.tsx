import { getSupabaseServer } from '@/lib/supabase/server';
import { BazaarWorkspace } from '@/components/bazaar/bazaar-workspace';
import { ROW_DEFS } from '@/components/bazaar/types';
import type { ShopGeo } from '@/lib/types';

export const metadata = { title: 'План базара — Барахолка.kz' };

type ShopRow = {
  id: string;
  name: string;
  coords: { coordinates: [number, number] } | null;
  photos: string[] | null;
  is_verified: boolean;
  sector: { code: string; zone: { name: string; slug: string } } | null;
};

export default async function MapPage() {
  let shops = await fetchShops();
  if (shops.length === 0) shops = fabricateMockShops();
  return <BazaarWorkspace shops={shops} />;
}

async function fetchShops(): Promise<ShopGeo[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('shop')
      .select('id, name, coords, photos, is_verified, sector:sector(code, zone:zone(name, slug))')
      .eq('is_active', true)
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

/** When the DB isn't seeded, render a believable bazaar out of fabricated rows. */
function fabricateMockShops(): ShopGeo[] {
  const out: ShopGeo[] = [];
  const sampleNames = [
    'Всё для школы', 'Спорт и туризм', 'Хит сезона', 'Оптовый склад',
    'Модный образ', 'Товары для дома', 'Детский мир', 'Обувной дом',
    'Лучшие цены', 'Семейный базар', 'Магазин мастеров', 'Кухонный рай',
    'Стиль и уют', 'Новинки', 'Для спорта', 'Всё по 500',
    'Распродажа', 'Премиум', 'Эконом-класс', 'Товары Казахстана',
  ];
  const countByRow: Record<string, number> = {
    adem: 38, olzha: 24, almaly: 18, merkur: 28,
    kulanda: 14, bolashak: 20, 'aina-sulu': 12, bereket: 30,
  };
  for (const def of ROW_DEFS) {
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
