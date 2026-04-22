'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Toggle a (buyer_id, product_id) row in `favorite`. Safe under RLS:
 * favorite_self_rw requires auth.uid() = buyer_id.
 */
export async function toggleFavorite(productId: string, formData: FormData) {
  const returnTo = String(formData.get('return_to') ?? '/');
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  const supabase = await getSupabaseServer();

  const { data: existing } = await supabase
    .from('favorite')
    .select('buyer_id')
    .eq('buyer_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase.from('favorite').delete().eq('buyer_id', user.id).eq('product_id', productId);
  } else {
    await supabase.from('favorite').insert({ buyer_id: user.id, product_id: productId });
  }

  revalidatePath('/favorites');
  revalidatePath(returnTo);
  redirect(returnTo);
}
