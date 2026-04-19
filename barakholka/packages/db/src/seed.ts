/**
 * Seed script. Run once after applying 0001_init.sql against your Supabase project.
 *
 *   cp .env.example .env.local  # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   pnpm seed
 *
 * Idempotent: re-running upserts the same reference rows by slug/code.
 */

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '../../../.env.local') });
loadEnv({ path: resolve(here, '../../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type Zone = { slug: string; name: string; center: [number, number]; radiusDeg: number };

const ZONES: Zone[] = [
  { slug: 'adem',    name: 'Адем',    center: [76.9260, 43.3305], radiusDeg: 0.0015 },
  { slug: 'alem',    name: 'Алем',    center: [76.9305, 43.3305], radiusDeg: 0.0015 },
  { slug: 'kulager', name: 'Кулагер', center: [76.9285, 43.3333], radiusDeg: 0.0011 },
];

const CATEGORIES = [
  { slug: 'clothing',           name_ru: 'Одежда',            parent: null },
  { slug: 'clothing-men',       name_ru: 'Мужская одежда',    parent: 'clothing' },
  { slug: 'clothing-women',     name_ru: 'Женская одежда',    parent: 'clothing' },
  { slug: 'clothing-kids',      name_ru: 'Детская одежда',    parent: 'clothing' },
  { slug: 'shoes',              name_ru: 'Обувь',             parent: null },
  { slug: 'accessories',        name_ru: 'Аксессуары',        parent: null },
];

const SAMPLE_TITLES = [
  'Куртка зимняя мужская',
  'Пуховик женский',
  'Джинсы прямые',
  'Кроссовки кожаные',
  'Шапка трикотажная',
  'Рубашка хлопковая',
  'Платье летнее',
  'Свитер шерстяной',
  'Сумка женская',
  'Ремень кожаный',
  'Носки набор 5 пар',
  'Детский комбинезон',
  'Футболка базовая',
  'Шорты спортивные',
  'Ботинки демисезонные',
];

function photo(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function jitter(center: [number, number], radiusDeg: number): [number, number] {
  return [center[0] + (Math.random() - 0.5) * 2 * radiusDeg, center[1] + (Math.random() - 0.5) * 2 * radiusDeg];
}

async function main() {
  console.log('→ market');
  const { data: marketUpsert, error: marketErr } = await supabase
    .from('market')
    .upsert(
      { name: 'Барахолка Алматы', city: 'Алматы', center_geo: 'SRID=4326;POINT(76.9286 43.3306)' as unknown as string },
      { onConflict: 'name' },
    )
    .select('id')
    .single();
  if (marketErr) throw marketErr;
  const marketId = marketUpsert!.id;

  console.log('→ zones');
  const zoneIds: Record<string, string> = {};
  for (const z of ZONES) {
    const polygon = buildPolygon(z.center, z.radiusDeg);
    const { data, error } = await supabase
      .from('zone')
      .upsert(
        { market_id: marketId, slug: z.slug, name: z.name, geojson_polygon: polygon, floor_count: 2 },
        { onConflict: 'market_id,slug' },
      )
      .select('id')
      .single();
    if (error) throw error;
    zoneIds[z.slug] = data!.id;
  }

  console.log('→ sectors');
  const sectorIds: string[] = [];
  for (const z of ZONES) {
    for (const code of ['A', 'B', 'C', 'D']) {
      for (const floor of [1, 2]) {
        const { data, error } = await supabase
          .from('sector')
          .upsert(
            { zone_id: zoneIds[z.slug], code, floor },
            { onConflict: 'zone_id,code,floor' },
          )
          .select('id')
          .single();
        if (error) throw error;
        sectorIds.push(data!.id);
      }
    }
  }

  console.log('→ categories');
  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const { data, error } = await supabase
      .from('category')
      .upsert(
        { slug: c.slug, name_ru: c.name_ru, parent_id: c.parent ? categoryIds[c.parent] : null },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error) throw error;
    categoryIds[c.slug] = data!.id;
  }

  console.log('→ seller (shared demo seller)');
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: 'demo-seller@barakholka.local',
    email_confirm: true,
    password: crypto.randomUUID(),
  });
  if (authErr && !authErr.message.includes('already')) throw authErr;

  let sellerId = authUser?.user?.id;
  if (!sellerId) {
    const { data: list } = await supabase.auth.admin.listUsers();
    sellerId = list.users.find((u) => u.email === 'demo-seller@barakholka.local')?.id;
  }
  if (!sellerId) throw new Error('cannot determine demo seller id');

  await supabase.from('seller').upsert({
    id: sellerId,
    full_name: 'Демо-продавец',
    phone: '+7 777 000 0000',
    is_verified: true,
    rating: 4.8,
  });

  console.log('→ shops');
  const shopIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const zone = rand(ZONES);
    const [lon, lat] = jitter(zone.center, zone.radiusDeg * 0.9);
    const sectorId = rand(sectorIds);
    const { data, error } = await supabase
      .from('shop')
      .insert({
        seller_id: sellerId,
        sector_id: sectorId,
        name: `Магазин №${i + 1}`,
        description: 'Одежда, обувь, аксессуары. Оптом и в розницу.',
        row_number: String(10 + (i % 12)),
        place_number: String(100 + i),
        coords: `SRID=4326;POINT(${lon} ${lat})` as unknown as string,
        photos: [photo(`shop-${i}-1`), photo(`shop-${i}-2`)],
        is_active: true,
        is_verified: i % 3 === 0,
      })
      .select('id')
      .single();
    if (error) throw error;
    shopIds.push(data!.id);
  }

  console.log('→ products');
  const leafCategorySlugs = ['clothing-men', 'clothing-women', 'clothing-kids', 'shoes', 'accessories'];
  for (let i = 0; i < 100; i++) {
    const shopId = rand(shopIds);
    const catSlug = rand(leafCategorySlugs);
    const title = `${rand(SAMPLE_TITLES)} · арт. ${1000 + i}`;
    const price = Math.round((2_000 + Math.random() * 48_000) / 100) * 100;
    const { data, error } = await supabase
      .from('product')
      .insert({
        shop_id: shopId,
        category_id: categoryIds[catSlug],
        title,
        description: 'Качественный товар с Барахолки. Размеры в наличии, возможен опт.',
        price_kzt: price,
        condition: Math.random() < 0.15 ? 'used' : 'new',
        is_wholesale: Math.random() < 0.2,
        min_wholesale_qty: Math.random() < 0.2 ? 10 : null,
        is_available: true,
      })
      .select('id')
      .single();
    if (error) throw error;
    const pid = data!.id;

    const photoCount = 1 + Math.floor(Math.random() * 3);
    const media = Array.from({ length: photoCount }, (_, j) => ({
      product_id: pid,
      type: 'photo' as const,
      url: photo(`p-${pid}-${j}`),
      order_idx: j,
    }));
    const { error: mediaErr } = await supabase.from('product_media').insert(media);
    if (mediaErr) throw mediaErr;
  }

  console.log('✓ done: 1 market, 3 zones, 24 sectors, 20 shops, 100 products');
}

function buildPolygon(center: [number, number], r: number): GeoJSON.Polygon {
  const [lon, lat] = center;
  return {
    type: 'Polygon',
    coordinates: [[
      [lon - r, lat - r],
      [lon + r, lat - r],
      [lon + r, lat + r],
      [lon - r, lat + r],
      [lon - r, lat - r],
    ]],
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
