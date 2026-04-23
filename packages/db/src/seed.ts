/**
 * Seed script. Run once after applying migrations 0001-0004 against your
 * Supabase project.
 *
 *   cp .env.example .env.local  # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   pnpm seed
 *
 * Seeds the REAL Almaty Barakholka cluster: one market with 10 named
 * pavilions (Адем, Алатау, Ялян, Олжа, Болашак, Алмалы, Меркур, Куланды,
 * Айна-Сулу, Берекет). Idempotent: re-running upserts reference rows by
 * slug. Shops and products are purged and re-created each run.
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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type PavilionDef = {
  slug: string;
  name: string;
  specialty: string;
  sectors: number;
  floors: number;
  capacity: number;
  /** [minLon, minLat, maxLon, maxLat] — matches public/zones.geojson. */
  bbox: [number, number, number, number];
};

// Capacities and bbox placements are research-based approximations, NOT a
// surveyed GIS trace. Bboxes intentionally match public/zones.geojson so the
// DB polygon and the static fallback agree. Sources: Walking Almaty,
// Eurasianet, Global Informality, ademtc.kz.
const PAVILIONS: PavilionDef[] = [
  { slug: 'alatau',    name: 'Алатау',    specialty: 'Ткани и швейное',   sectors: 5, floors: 3, capacity: 250, bbox: [76.9093, 43.3476, 76.9122, 43.3490] },
  { slug: 'olzha',     name: 'Олжа',      specialty: 'Обувь',             sectors: 4, floors: 2, capacity: 180, bbox: [76.9075, 43.3461, 76.9096, 43.3473] },
  { slug: 'adem',      name: 'Адем',      specialty: 'Одежда и верх',     sectors: 6, floors: 3, capacity: 300, bbox: [76.9125, 43.3458, 76.9156, 43.3478] },
  { slug: 'almaly',    name: 'Алмалы',    specialty: 'Смешанные товары',  sectors: 5, floors: 2, capacity: 200, bbox: [76.9160, 43.3461, 76.9182, 43.3477] },
  { slug: 'merkur',    name: 'Меркур',    specialty: 'Текстиль, бельё',   sectors: 4, floors: 2, capacity: 140, bbox: [76.9185, 43.3462, 76.9203, 43.3475] },
  { slug: 'yalyan',    name: 'Ялян',      specialty: 'Опт, Европа',       sectors: 8, floors: 2, capacity: 400, bbox: [76.9208, 43.3447, 76.9244, 43.3470] },
  { slug: 'kulanda',   name: 'Куланды',   specialty: 'Хозтовары',         sectors: 3, floors: 1, capacity: 90,  bbox: [76.9097, 43.3427, 76.9118, 43.3438] },
  { slug: 'bolashak',  name: 'Болашак',   specialty: 'Инструмент',        sectors: 4, floors: 2, capacity: 150, bbox: [76.9124, 43.3424, 76.9152, 43.3440] },
  { slug: 'aina-sulu', name: 'Айна-Сулу', specialty: 'Свет и электрика', sectors: 3, floors: 1, capacity: 80,  bbox: [76.9156, 43.3426, 76.9176, 43.3437] },
  { slug: 'bereket',   name: 'Берекет',   specialty: 'Посуда и дом',      sectors: 3, floors: 1, capacity: 100, bbox: [76.9180, 43.3425, 76.9202, 43.3438] },
];

function bboxToPolygon([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) {
  return {
    type: 'Polygon' as const,
    coordinates: [[
      [minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat],
    ]],
  };
}

function bboxCenter([minLon, minLat, maxLon, maxLat]: [number, number, number, number]): [number, number] {
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

function bboxRadiusDeg([minLon, , maxLon]: [number, number, number, number]): number {
  return (maxLon - minLon) / 2;
}

const CATEGORIES = [
  { slug: 'clothing',       name_ru: 'Одежда',           parent: null },
  { slug: 'clothing-men',   name_ru: 'Мужская одежда',   parent: 'clothing' },
  { slug: 'clothing-women', name_ru: 'Женская одежда',   parent: 'clothing' },
  { slug: 'clothing-kids',  name_ru: 'Детская одежда',   parent: 'clothing' },
  { slug: 'shoes',          name_ru: 'Обувь',            parent: null },
  { slug: 'textile',        name_ru: 'Ткани и текстиль', parent: null },
  { slug: 'home',           name_ru: 'Дом и посуда',     parent: null },
  { slug: 'tools',          name_ru: 'Инструмент',       parent: null },
  { slug: 'electrics',      name_ru: 'Электрика и свет', parent: null },
  { slug: 'accessories',    name_ru: 'Аксессуары',       parent: null },
];

const SAMPLE_TITLES = [
  'Куртка зимняя мужская', 'Пуховик женский', 'Джинсы прямые',
  'Кроссовки кожаные', 'Шапка трикотажная', 'Рубашка хлопковая',
  'Платье летнее', 'Свитер шерстяной', 'Сумка женская',
  'Ремень кожаный', 'Носки набор 5 пар', 'Детский комбинезон',
  'Футболка базовая', 'Шорты спортивные', 'Ботинки демисезонные',
];

function photo(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;
}

function jitter(center: [number, number], r: number): [number, number] {
  return [center[0] + (Math.random() - 0.5) * 2 * r, center[1] + (Math.random() - 0.5) * 2 * r];
}

async function main() {
  console.log('→ market');
  const { data: market, error: marketErr } = await supabase
    .from('market')
    .upsert(
      { name: 'Алматинская барахолка', city: 'Алматы', center_geo: 'SRID=4326;POINT(76.9145 43.3450)' as unknown as string },
      { onConflict: 'name' },
    )
    .select('id')
    .single();
  if (marketErr) throw marketErr;
  const marketId = (market as { id: string }).id;

  console.log('→ zones (10 pavilions with capacity-proportional footprints)');
  const zoneIds: Record<string, string> = {};
  for (const p of PAVILIONS) {
    const geojson = bboxToPolygon(p.bbox);
    const { data, error } = await supabase
      .from('zone')
      .upsert(
        { market_id: marketId, slug: p.slug, name: p.name, geojson_polygon: geojson, floor_count: p.floors },
        { onConflict: 'market_id,slug' },
      )
      .select('id')
      .single();
    if (error) throw error;
    zoneIds[p.slug] = (data as { id: string }).id;
  }

  console.log('→ sectors');
  const sectorIds: Record<string, string[]> = {};
  for (const p of PAVILIONS) {
    sectorIds[p.slug] = [];
    for (let floor = 1; floor <= p.floors; floor++) {
      for (let i = 0; i < p.sectors; i++) {
        const code = String.fromCharCode('A'.charCodeAt(0) + i);
        const { data, error } = await supabase
          .from('sector')
          .upsert(
            { zone_id: zoneIds[p.slug], code, floor },
            { onConflict: 'zone_id,code,floor' },
          )
          .select('id')
          .single();
        if (error) throw error;
        sectorIds[p.slug]!.push((data as { id: string }).id);
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
    categoryIds[c.slug] = (data as { id: string }).id;
  }

  console.log('→ demo seller');
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: 'demo-seller@barakholka.local',
    email_confirm: true,
    password: crypto.randomUUID(),
  });
  let sellerId = authUser?.user?.id;
  if (!sellerId) {
    const { data: list } = await supabase.auth.admin.listUsers();
    sellerId = list.users.find((u) => u.email === 'demo-seller@barakholka.local')?.id;
  }
  if (!sellerId) throw new Error('cannot resolve demo seller id');
  await supabase.from('seller').upsert({
    id: sellerId,
    full_name: 'Демо-продавец',
    phone: '+7 777 000 0000',
    is_verified: true,
    is_admin: true,
    rating: 4.8,
  });

  console.log('→ purge old shops & products for clean re-seed');
  await supabase.from('shop').delete().eq('seller_id', sellerId);

  console.log('→ shops (distributed across pavilions)');
  let shopCount = 0;
  const SAMPLE_SHOP_NAMES = [
    'Всё для школы', 'Спорт и туризм', 'Хит сезона', 'Оптовый склад',
    'Модный образ', 'Товары для дома', 'Детский мир', 'Обувной дом',
    'Семейный базар', 'Магазин мастеров', 'Кухонный рай', 'Стиль и уют',
    'Всё по 500', 'Распродажа', 'Премиум', 'Товары Казахстана',
  ];
  const shopIdsByPavilion: Record<string, string[]> = {};
  for (const p of PAVILIONS) {
    const shopsInPavilion = Math.min(6, Math.ceil(p.capacity / 50));
    shopIdsByPavilion[p.slug] = [];
    const center = bboxCenter(p.bbox);
    const radius = bboxRadiusDeg(p.bbox) * 0.75;
    for (let i = 0; i < shopsInPavilion; i++) {
      const [lon, lat] = jitter(center, radius);
      const sectors = sectorIds[p.slug]!;
      const sectorId = sectors[(i + shopCount) % sectors.length]!;
      const nameIdx = (shopCount + p.slug.length) % SAMPLE_SHOP_NAMES.length;
      const { data, error } = await supabase
        .from('shop')
        .insert({
          seller_id: sellerId,
          sector_id: sectorId,
          name: `${SAMPLE_SHOP_NAMES[nameIdx]!} · ${p.name}`,
          description: `${p.specialty}. Опт и розница.`,
          row_number: String(10 + (i % 12)),
          place_number: String(100 + shopCount),
          coords: `SRID=4326;POINT(${lon} ${lat})` as unknown as string,
          photos: [photo(`shop-${p.slug}-${i}-1`), photo(`shop-${p.slug}-${i}-2`)],
          is_active: true,
          is_verified: shopCount % 3 === 0,
        })
        .select('id')
        .single();
      if (error) throw error;
      shopIdsByPavilion[p.slug]!.push((data as { id: string }).id);
      shopCount++;
    }
  }

  console.log('→ products (8 per shop avg)');
  const allShopIds = Object.values(shopIdsByPavilion).flat();
  const leafCategories = ['clothing-men', 'clothing-women', 'clothing-kids', 'shoes', 'textile', 'home', 'tools', 'electrics', 'accessories'];
  let productCount = 0;
  for (const shopId of allShopIds) {
    const productsPerShop = 6 + Math.floor(Math.random() * 5);
    for (let j = 0; j < productsPerShop; j++) {
      const catSlug = leafCategories[Math.floor(Math.random() * leafCategories.length)]!;
      const title = `${SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)]!} · арт. ${1000 + productCount}`;
      const price = Math.round((2000 + Math.random() * 48000) / 100) * 100;
      const { data: prod, error: prodErr } = await supabase
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
      if (prodErr) throw prodErr;
      const pid = (prod as { id: string }).id;

      const photoCount = 1 + Math.floor(Math.random() * 3);
      const media = Array.from({ length: photoCount }, (_, k) => ({
        product_id: pid,
        type: 'photo' as const,
        url: photo(`p-${pid}-${k}`),
        order_idx: k,
      }));
      await supabase.from('product_media').insert(media);

      productCount++;
    }
  }

  console.log(`✓ done: 1 market, ${PAVILIONS.length} pavilions, ${shopCount} shops, ${productCount} products`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
