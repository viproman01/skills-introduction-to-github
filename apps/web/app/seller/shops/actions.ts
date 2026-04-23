'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

type ShopPayload = {
  name: string;
  description: string | null;
  sector_id: string | null;
  row_number: string | null;
  place_number: string | null;
  photos: string[];
  is_active: boolean;
};

function parseShopForm(formData: FormData): ShopPayload {
  const photos = String(formData.get('photos') ?? '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: nullable(formData.get('description')),
    sector_id: nullable(formData.get('sector_id')),
    row_number: nullable(formData.get('row_number')),
    place_number: nullable(formData.get('place_number')),
    photos,
    is_active: formData.get('is_active') === 'on',
  };
}

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function createShop(formData: FormData) {
  const seller = await requireSeller('/seller/shops/new');
  const payload = parseShopForm(formData);
  if (!payload.name) redirect('/seller/shops/new?error=name');

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('shop')
    .insert({ ...payload, seller_id: seller.userId })
    .select('id')
    .single();

  if (error) redirect(`/seller/shops/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath('/seller/shops');
  redirect(`/seller/shops/${(data as { id: string }).id}?saved=1`);
}

export async function updateShop(id: string, formData: FormData) {
  const seller = await requireSeller(`/seller/shops/${id}`);
  const payload = parseShopForm(formData);
  if (!payload.name) redirect(`/seller/shops/${id}?error=name`);

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('shop')
    .update(payload)
    .eq('id', id)
    .eq('seller_id', seller.userId);
  if (error) redirect(`/seller/shops/${id}?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/seller/shops');
  revalidatePath(`/seller/shops/${id}`);
  redirect(`/seller/shops/${id}?saved=1`);
}

export async function deleteShop(id: string) {
  const seller = await requireSeller();
  const supabase = await getSupabaseServer();
  await supabase.from('shop').delete().eq('id', id).eq('seller_id', seller.userId);
  revalidatePath('/seller/shops');
  redirect('/seller/shops');
}
