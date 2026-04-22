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
  viewers: number;
  avgCheck: number;
  deals: number;
  responseMin: number;
  openHours: string;
  priceMin: number;
  priceMax: number;
  sellerName: string;
  products: string[];
};

export type Container = ShopGeo & ContainerExtras & {
  rowSlug: string;
  rowName: string;
  rowLetter: string; // A, B, C… derived from row position in the list
  containerNo: string;
};

export type RowDef = {
  slug: string;
  letter: string;
  name: string;
  icon: string;
};

/**
 * Default pavilion list — the 10 pavilions of the real Almaty Barakholka
 * cluster along Северное кольцо. Used as a fallback when the /map page
 * can't load live data from the DB. Each entry is a real, named pavilion,
 * not an invented letter row.
 *
 * Sources: field notes + Walking Almaty + Eurasianet + Global Informality.
 */
export const ROW_DEFS: RowDef[] = [
  { slug: 'adem',      letter: 'А', name: 'Адем',      icon: '👕' },
  { slug: 'alatau',    letter: 'Б', name: 'Алатау',    icon: '🧵' },
  { slug: 'yalyan',    letter: 'В', name: 'Ялян',      icon: '📦' },
  { slug: 'olzha',     letter: 'Г', name: 'Олжа',      icon: '👟' },
  { slug: 'bolashak',  letter: 'Д', name: 'Болашак',   icon: '🔧' },
  { slug: 'almaly',    letter: 'Е', name: 'Алмалы',    icon: '🛍️' },
  { slug: 'merkur',    letter: 'Ж', name: 'Меркур',    icon: '🛏️' },
  { slug: 'kulanda',   letter: 'З', name: 'Куланды',   icon: '🔩' },
  { slug: 'aina-sulu', letter: 'И', name: 'Айна-Сулу', icon: '💡' },
  { slug: 'bereket',   letter: 'К', name: 'Берекет',   icon: '🍽️' },
];

export const ROW_CAPACITY: Record<string, number> = {
  adem: 48, alatau: 40, yalyan: 56, olzha: 32,
  bolashak: 28, almaly: 36, merkur: 24, kulanda: 20,
  'aina-sulu': 18, bereket: 22,
};

const DEFAULT_ICON_CYCLE = ['🏬', '👕', '🧵', '📦', '👟', '🔧', '🛍️', '🛏️', '🔩', '💡', '🍽️', '🪑'];
const LETTER_ALPHABET = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩ';

/**
 * Convert a list of DB zones into RowDef[] — assigns letters А Б В…
 * positionally and falls back to a rotating icon if no pavilion-specific
 * icon is known.
 */
export function rowDefsFromZones(
  zones: { slug: string; name: string }[],
): RowDef[] {
  const iconBySlug = Object.fromEntries(ROW_DEFS.map((r) => [r.slug, r.icon]));
  return zones.map((z, i) => ({
    slug: z.slug,
    letter: LETTER_ALPHABET[i] ?? '•',
    name: z.name,
    icon: iconBySlug[z.slug] ?? DEFAULT_ICON_CYCLE[i % DEFAULT_ICON_CYCLE.length]!,
  }));
}

export type Filters = {
  openNow: boolean;
  torg: boolean;
  video: boolean;
  live: boolean;
  wholesale: boolean;
  priceMin: number;
  priceMax: number;
  ratingMin: number;
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
  'Гульнара Абенова',  'Ержан Касымов',     'Асель Нурланова',
  'Бауыржан Мусин',    'Динара Сериккали',  'Марат Жанболатов',
  'Айгуль Оспанова',   'Нурлан Сатыбалдыев','Салтанат Ахметова',
  'Руслан Калиев',     'Жанара Токтарова',  'Алмас Ибрагимов',
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

/**
 * Decorate a raw ShopGeo with deterministic mock "live" properties so the
 * bazaar plan has something to render before the backend knows about
 * streaming, hits, etc. Takes the row list so letters and row names stay
 * in sync with whatever /map resolved (DB or fallback).
 */
export function enrich(shop: ShopGeo, rows: RowDef[] = ROW_DEFS): Container {
  const h = hash(shop.id);
  const rowIdx = rows.findIndex((r) => r.slug === shop.zone_slug);
  const rowDef = rowIdx >= 0 ? rows[rowIdx]! : undefined;
  const rowLetter = rowDef?.letter ?? '•';
  const rowName = rowDef?.name ?? shop.zone_name ?? 'Без ряда';
  const containerNo = String((h % 120) + 1).padStart(2, '0');

  const openNow = (h % 100) > 12;
  const isLive = openNow && (h % 100) < 6;
  const isHit = (h % 100) < 22 && !isLive;
  const isWholesale = (h % 100) < 28;
  const torg = (h % 100) < 68;

  const catIdx = Math.max(0, rowIdx) % PRODUCT_WORDS.length;
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
