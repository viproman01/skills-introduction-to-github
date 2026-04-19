import { getSupabaseServer } from '@/lib/supabase/server';
import { MapExplorer } from '@/components/map-explorer';
import type { ShopGeo } from '@/lib/types';

export const metadata = { title: 'Карта — Барахолка.kz' };

type ShopRow = {
  id: string;
  name: string;
  coords: { coordinates: [number, number] } | null;
  photos: string[] | null;
  is_verified: boolean;
  sector: { code: string; zone: { name: string; slug: string } } | null;
};

export default async function MapPage() {
  const shops = await fetchShopsWithCoords();
  return <MapExplorer shops={shops} />;
}

async function fetchShopsWithCoords(): Promise<ShopGeo[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('shop')
      .select('id, name, coords, photos, is_verified, sector:sector(code, zone:zone(name, slug))')
      .eq('is_active', true)
      .not('coords', 'is', null)
      .limit(1000);

    const rows = (data ?? []) as unknown as ShopRow[];
    return rows
      .filter((s) => s.coords?.coordinates)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lon: s.coords!.coordinates[0],
        lat: s.coords!.coordinates[1],
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
