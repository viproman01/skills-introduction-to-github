import type { ShopGeo } from '@/lib/types';

/** Extra container-level fields mocked deterministically from shop.id. */
export type ContainerExtras = {
  isLive: boolean;
  isHit: boolean;
  isWholesale: boolean;
  torg: boolean;
  delivery: boolean;
  hasVideo: boolean;
  openNow: boolean;
  rating: number; // 1.0–5.0
  reviews: number;
  yearsOnMarket: number;
  viewers: number; // LIVE viewers
  avgCheck: number; // KZT
  deals: number;
  responseMin: number;
  openHours: string;
  priceMin: number; // KZT
  priceMax: number;
  sellerName: string;
  products: string[]; // product labels (mock lot names)
};

export type Container = ShopGeo & ContainerExtras & {
  rowSlug: string; // zone_slug mapped
  rowName: string; // zone_name mapped
  rowLetter: string; // first letter from zone name (А, Б, В, ...)
  containerNo: string; // sector_code + numeric suffix
};

export type RowDef = {
  slug: string;
  letter: string;
  name: string;
  icon: string;
};

/** Mapping of DB zone slugs to the row letters used in the bazaar plan. */
export const ROW_DEFS: RowDef[] = [
  { slug: 'adem',      letter: 'А', name: 'Одежда и верх',   icon: '👕' },
  { slug: 'olzha',     letter: 'Б', name: 'Обувь',           icon: '👟' },
  { slug: 'almaly',    letter: 'В', name: 'Детское · игрушки', icon: '🧸' },
  { slug: 'merkur',    letter: 'Г', name: 'Текстиль · постель', icon: '🛏️' },
  { slug: 'kulanda',   letter: 'Д', name: 'Оптовый ряд',     icon: '📦' },
  { slug: 'bolashak',  letter: 'Е', name: 'Инструмент',       icon: '🔧' },
  { slug: 'aina-sulu', letter: 'Ж', name: 'Электрика · свет', icon: '💡' },
  { slug: 'bereket',   letter: 'З', name: 'Для дома · посуда', icon: '🍽️' },
];

export const ROW_CAPACITY: Record<string, number> = {
  adem: 48,
  olzha: 32,
  almaly: 24,
  merkur: 36,
  kulanda: 20,
  bolashak: 28,
  'aina-sulu': 18,
  bereket: 42,
};

export type Filters = {
  openNow: boolean;
  torg: boolean;
  video: boolean;
  live: boolean;
  wholesale: boolean;
  priceMin: number;
  priceMax: number;
  ratingMin: number; // 0, 4, 4.5, 5
};

export const DEFAULT_FILTERS: Filters = {
  openNow: false,
  torg: false,
  video: false,
  live: false,
  wholesale: false,
  priceMin: 1200,
  priceMax: 42000,
  ratingMin: 0,
};

const SELLER_NAMES = [
  'Гульнара Абенова',
  'Ержан Касымов',
  'Асель Нурланова',
  'Бауыржан Мусин',
  'Динара Сериккали',
  'Марат Жанболатов',
  'Айгуль Оспанова',
  'Нурлан Сатыбалдыев',
  'Салтанат Ахметова',
  'Руслан Калиев',
  'Жанара Токтарова',
  'Алмас Ибрагимов',
];

const PRODUCT_WORDS = [
  ['куртка', 'парка', 'пуховик', 'жилет', 'ветровка'],
  ['кроссовки', 'кеды', 'ботинки', 'туфли', 'сапоги'],
  ['рюкзак', 'пенал', 'форма', 'термос', 'папка'],
  ['плед', 'подушка', 'простыня', 'полотенце', 'одеяло'],
  ['дрель', 'ключи', 'молоток', 'отвёртка', 'шуруповёрт'],
  ['лампа', 'провод', 'выключатель', 'щиток', 'патрон'],
  ['тарелка', 'кастрюля', 'чайник', 'набор', 'сервиз'],
];

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], h: number): T {
  return arr[h % arr.length]!;
}

export function enrich(shop: ShopGeo): Container {
  const h = hash(shop.id);
  const rowDef = ROW_DEFS.find((r) => r.slug === shop.zone_slug);
  const rowLetter = rowDef?.letter ?? '?';
  const rowName = rowDef?.name ?? shop.zone_name ?? 'Без ряда';
  const containerNo = String((h % 120) + 1).padStart(2, '0');

  const openNow = (h % 100) > 12;
  const isLive = openNow && (h % 100) < 6;
  const isHit = (h % 100) < 22 && !isLive;
  const isWholesale = (h % 100) < 28;
  const torg = (h % 100) < 68;

  const catIdx = Math.max(0, ROW_DEFS.findIndex((r) => r.slug === shop.zone_slug)) % PRODUCT_WORDS.length;
  const words = PRODUCT_WORDS[catIdx] ?? PRODUCT_WORDS[0]!;
  const products = Array.from(
    { length: 4 + (h % 4) },
    (_, i) => words[(h + i * 7) % words.length]!,
  );

  return {
    ...shop,
    rowSlug: shop.zone_slug ?? 'unknown',
    rowName,
    rowLetter,
    containerNo,
    isLive,
    isHit,
    isWholesale,
    torg,
    delivery: (h % 100) < 40,
    hasVideo: (h % 100) < 55,
    openNow,
    rating: 3.8 + ((h % 13) / 10),
    reviews: 50 + (h % 900),
    yearsOnMarket: 1 + (h % 14),
    viewers: isLive ? 20 + (h % 180) : 0,
    avgCheck: ((h % 300) + 40) * 100,
    deals: 80 + (h % 1200),
    responseMin: 1 + (h % 29),
    openHours: '07-17',
    priceMin: 1200 + ((h % 30) * 100),
    priceMax: 8000 + ((h % 400) * 100),
    sellerName: pick(SELLER_NAMES, h),
    products,
  };
}

export function matchesFilters(c: Container, f: Filters): boolean {
  if (f.openNow && !c.openNow) return false;
  if (f.torg && !c.torg) return false;
  if (f.video && !c.hasVideo) return false;
  if (f.live && !c.isLive) return false;
  if (f.wholesale && !c.isWholesale) return false;
  if (c.priceMin > f.priceMax) return false;
  if (c.priceMax < f.priceMin) return false;
  if (f.ratingMin > 0 && c.rating < f.ratingMin) return false;
  return true;
}

export function formatKzt(n: number): string {
  return new Intl.NumberFormat('ru-KZ').format(n) + ' ₸';
}
