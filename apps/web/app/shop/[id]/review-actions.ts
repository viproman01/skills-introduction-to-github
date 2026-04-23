'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Upsert a review for the signed-in user on this shop. The RLS policy
 * `review_self_write` guards this; unique (shop_id, buyer_id) means one
 * review per user per shop, auto-replaces on re-submit.
 */
export async function submitReview(shopId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/shop/${shopId}#review`)}`);

  const rating = Math.max(1, Math.min(5, Number(formData.get('rating') ?? 0)));
  const text = String(formData.get('text') ?? '').trim().slice(0, 2000);
  if (!rating) redirect(`/shop/${shopId}?review=rating`);

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('review').upsert(
    { shop_id: shopId, buyer_id: user.id, rating, text: text || null },
    { onConflict: 'shop_id,buyer_id' },
  );
  if (error) redirect(`/shop/${shopId}?review=${encodeURIComponent(error.message)}`);

  revalidatePath(`/shop/${shopId}`);
  redirect(`/shop/${shopId}?review=ok#reviews`);
}

export async function deleteMyReview(shopId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await getSupabaseServer();
  await supabase.from('review').delete().eq('shop_id', shopId).eq('buyer_id', user.id);
  revalidatePath(`/shop/${shopId}`);
}
