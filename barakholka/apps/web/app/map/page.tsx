import { getSupabaseServer } from '@/lib/supabase/server';
import { MapView } from '@/components/map-view';
import type { ShopGeo } from '@/lib/types';

export const metadata = { title: 'Карта — Барахолка.kz' };

type ShopRow = {
  id: string;
  name: string;
  coords: { coordinates: [number, number] } | null;
  photos: string[] | null;
};

export default async function MapPage() {
  const shops = await fetchShopsWithCoords();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Карта</h1>
        <div className="text-sm text-neutral-500">{shops.length} магазинов</div>
      </div>
      <MapView shops={shops} />
    </div>
  );
}

async function fetchShopsWithCoords(): Promise<ShopGeo[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('shop')
      .select('id, name, coords, photos')
      .eq('is_active', true)
      .not('coords', 'is', null)
      .limit(500);

    const rows = (data ?? []) as unknown as ShopRow[];
    return rows
      .filter((s) => s.coords?.coordinates)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lon: s.coords!.coordinates[0],
        lat: s.coords!.coordinates[1],
        photo: s.photos?.[0] ?? null,
      }));
  } catch {
    return [];
  }
}
