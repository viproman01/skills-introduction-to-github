'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `s-${Date.now().toString(36)}`;
}

function parseForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const orderRaw = String(formData.get('order_idx') ?? '0');
  return {
    name,
    slug: slugRaw || slugify(name),
    order_idx: Math.max(0, parseInt(orderRaw, 10) || 0),
    is_visible: formData.get('is_visible') === 'on',
  };
}

async function assertOwnsShop(shopId: string) {
  const seller = await requireSeller(`/seller/shops/${shopId}/sections`);
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('shop')
    .select('id')
    .eq('id', shopId)
    .eq('seller_id', seller.userId)
    .maybeSingle();
  if (!data) redirect('/seller/shops');
  return { seller, supabase };
}

export async function createSection(shopId: string, formData: FormData) {
  const { supabase } = await assertOwnsShop(shopId);
  const payload = parseForm(formData);
  if (!payload.name) redirect(`/seller/shops/${shopId}/sections/new?error=name`);

  const { error } = await supabase.from('shop_section').insert({ shop_id: shopId, ...payload });
  if (error) redirect(`/seller/shops/${shopId}/sections/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/seller/shops/${shopId}/sections`);
  redirect(`/seller/shops/${shopId}/sections?saved=1`);
}

export async function updateSection(shopId: string, sectionId: string, formData: FormData) {
  const { supabase } = await assertOwnsShop(shopId);
  const payload = parseForm(formData);
  if (!payload.name) redirect(`/seller/shops/${shopId}/sections/${sectionId}?error=name`);

  const { error } = await supabase
    .from('shop_section')
    .update(payload)
    .eq('id', sectionId)
    .eq('shop_id', shopId);
  if (error) redirect(`/seller/shops/${shopId}/sections/${sectionId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/seller/shops/${shopId}/sections`);
  redirect(`/seller/shops/${shopId}/sections?saved=1`);
}

export async function deleteSection(shopId: string, sectionId: string) {
  const { supabase } = await assertOwnsShop(shopId);
  await supabase.from('shop_section').delete().eq('id', sectionId).eq('shop_id', shopId);
  revalidatePath(`/seller/shops/${shopId}/sections`);
  redirect(`/seller/shops/${shopId}/sections`);
}
