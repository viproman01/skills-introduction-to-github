import { getSupabaseServer } from './supabase/server';

export type MarketRef = { id: string; slug: string; name: string; city: string };

/**
 * Slug convention: derive from name by lowercasing, stripping non-letters.
 * Since the schema doesn't yet have a slug column on market, we compute one.
 */
export function marketSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listMarkets(): Promise<MarketRef[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.from('market').select('id, name, city').order('name');
    const rows = (data ?? []) as { id: string; name: string; city: string }[];
    return rows.map((m) => ({ ...m, slug: marketSlug(m.name) }));
  } catch {
    return [];
  }
}

/** Resolve a market by slug; defaults to the first market in the DB. */
export async function resolveMarket(slug?: string | null): Promise<MarketRef | null> {
  const markets = await listMarkets();
  if (markets.length === 0) return null;
  if (slug) return markets.find((m) => m.slug === slug) ?? markets[0]!;
  return markets[0]!;
}
