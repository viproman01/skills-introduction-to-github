'use server';

import { revalidatePath } from 'next/cache';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

const STATUSES = ['new', 'contacted', 'done', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];

export async function updateLeadStatus(id: string, formData: FormData) {
  await requireSeller('/seller/leads');
  const raw = String(formData.get('status') ?? '');
  if (!(STATUSES as readonly string[]).includes(raw)) return;
  const status = raw as Status;

  const supabase = await getSupabaseServer();
  await supabase.from('order_lead').update({ status }).eq('id', id);
  revalidatePath('/seller/leads');
}
