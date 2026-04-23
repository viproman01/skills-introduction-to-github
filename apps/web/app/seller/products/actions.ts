'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

type ProductPayload = {
  shop_id: string;
  category_id: string | null;
  section_id: string | null;
  title: string;
  description: string | null;
  price_kzt: number;
  condition: 'new' | 'used';
  is_wholesale: boolean;
  min_wholesale_qty: number | null;
  is_available: boolean;
};

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function parseProductForm(formData: FormData): { payload: ProductPayload; photos: string[] } {
  const photos = String(formData.get('photos') ?? '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const minWholesaleRaw = nullable(formData.get('min_wholesale_qty'));
  const payload: ProductPayload = {
    shop_id: String(formData.get('shop_id') ?? ''),
    category_id: nullable(formData.get('category_id')),
    section_id: nullable(formData.get('section_id')),
    title: String(formData.get('title') ?? '').trim(),
    description: nullable(formData.get('description')),
    price_kzt: Math.max(0, Math.floor(Number(formData.get('price_kzt') ?? 0))),
    condition: formData.get('condition') === 'used' ? 'used' : 'new',
    is_wholesale: formData.get('is_wholesale') === 'on',
    min_wholesale_qty: minWholesaleRaw ? Math.max(1, Math.floor(Number(minWholesaleRaw))) : null,
    is_available: formData.get('is_available') === 'on',
  };
  return { payload, photos };
}

async function replaceMedia(productId: string, photos: string[]) {
  const supabase = await getSupabaseServer();
  await supabase.from('product_media').delete().eq('product_id', productId);
  if (photos.length === 0) return;
  const rows = photos.map((url, idx) => ({
    product_id: productId,
    type: 'photo' as const,
    url,
    order_idx: idx,
  }));
  await supabase.from('product_media').insert(rows);
}

export async function createProduct(formData: FormData) {
  await requireSeller('/seller/products/new');
  const { payload, photos } = parseProductForm(formData);
  if (!payload.title) redirect('/seller/products/new?error=title');
  if (!payload.shop_id) redirect('/seller/products/new?error=shop');

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('product')
    .insert(payload)
    .select('id')
    .single();
  if (error) redirect(`/seller/products/new?error=${encodeURIComponent(error.message)}`);

  const id = (data as { id: string }).id;
  if (photos.length) await replaceMedia(id, photos);

  revalidatePath('/seller/products');
  redirect(`/seller/products/${id}?saved=1`);
}

export async function updateProduct(id: string, formData: FormData) {
  const seller = await requireSeller(`/seller/products/${id}`);
  const { payload, photos } = parseProductForm(formData);
  if (!payload.title) redirect(`/seller/products/${id}?error=title`);

  const supabase = await getSupabaseServer();

  // Verify the target product belongs to a shop owned by this seller.
  const { data: existing } = await supabase
    .from('product')
    .select('id, shop:shop!inner(seller_id)')
    .eq('id', id)
    .maybeSingle();
  type Ownership = { id: string; shop: { seller_id: string } | null };
  const owned = existing as Ownership | null;
  if (!owned || owned.shop?.seller_id !== seller.userId) {
    redirect('/seller/products');
  }

  const { error } = await supabase.from('product').update(payload).eq('id', id);
  if (error) redirect(`/seller/products/${id}?error=${encodeURIComponent(error.message)}`);

  await replaceMedia(id, photos);

  revalidatePath('/seller/products');
  revalidatePath(`/seller/products/${id}`);
  redirect(`/seller/products/${id}?saved=1`);
}

export async function deleteProduct(id: string) {
  const seller = await requireSeller();
  const supabase = await getSupabaseServer();

  const { data: existing } = await supabase
    .from('product')
    .select('id, shop:shop!inner(seller_id)')
    .eq('id', id)
    .maybeSingle();
  type Ownership = { id: string; shop: { seller_id: string } | null };
  const owned = existing as Ownership | null;
  if (owned && owned.shop?.seller_id === seller.userId) {
    await supabase.from('product').delete().eq('id', id);
  }

  revalidatePath('/seller/products');
  redirect('/seller/products');
}
