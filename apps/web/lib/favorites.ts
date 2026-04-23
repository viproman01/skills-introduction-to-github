import { getSupabaseServer } from './supabase/server';
import { getCurrentUser } from './auth';

/**
 * Return a Set of product IDs the current user has favorited. Empty set
 * when the user is anonymous or the query fails.
 */
export async function getFavoriteSet(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('favorite')
      .select('product_id')
      .eq('buyer_id', user.id);
    const rows = (data ?? []) as { product_id: string }[];
    return new Set(rows.map((r) => r.product_id));
  } catch {
    return new Set();
  }
}
