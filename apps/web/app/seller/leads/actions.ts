'use server';

import { revalidatePath } from 'next/cache';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

const STATUSES = ['new', 'contacted', 'done', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];

export async function updateLeadStatus(id: string, formData: FormData) {
  const seller = await requireSeller('/seller/leads');
  const raw = String(formData.get('status') ?? '');
  if (!(STATUSES as readonly string[]).includes(raw)) return;
  const status = raw as Status;

  const supabase = await getSupabaseServer();

  // Verify the lead's product's shop belongs to this seller.
  const { data } = await supabase
    .from('order_lead')
    .select('id, product:product!inner(shop:shop!inner(seller_id))')
    .eq('id', id)
    .maybeSingle();
  type Ownership = { id: string; product: { shop: { seller_id: string } | null } | null };
  const owned = data as Ownership | null;
  if (!owned || owned.product?.shop?.seller_id !== seller.userId) return;

  await supabase.from('order_lead').update({ status }).eq('id', id);
  revalidatePath('/seller/leads');
}
