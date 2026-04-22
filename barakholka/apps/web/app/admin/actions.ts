'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function setShopVerified(shopId: string, value: boolean) {
  await requireAdmin();
  const supabase = await getSupabaseServer();
  await supabase.from('shop').update({ is_verified: value }).eq('id', shopId);
  revalidatePath('/admin/shops');
  revalidatePath(`/shop/${shopId}`);
}

export async function setShopActive(shopId: string, value: boolean) {
  await requireAdmin();
  const supabase = await getSupabaseServer();
  await supabase.from('shop').update({ is_active: value }).eq('id', shopId);
  revalidatePath('/admin/shops');
  revalidatePath(`/shop/${shopId}`);
}

export async function setProductAvailable(productId: string, value: boolean) {
  await requireAdmin();
  const supabase = await getSupabaseServer();
  await supabase.from('product').update({ is_available: value }).eq('id', productId);
  revalidatePath('/admin/products');
  revalidatePath(`/product/${productId}`);
}

export async function deleteReviewAdmin(reviewId: string) {
  await requireAdmin();
  const supabase = await getSupabaseServer();
  await supabase.from('review').delete().eq('id', reviewId);
  revalidatePath('/admin/reviews');
}
