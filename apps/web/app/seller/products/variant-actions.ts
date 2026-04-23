'use server';

import { revalidatePath } from 'next/cache';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Replace all variants for a product with the set submitted in the form.
 * Runs under the seller's session so RLS on product_variant verifies the
 * parent product.shop.seller_id matches auth.uid().
 */
export async function saveVariants(productId: string, formData: FormData) {
  await requireSeller(`/seller/products/${productId}`);
  const supabase = await getSupabaseServer();

  // Verify ownership explicitly (defense in depth on top of RLS)
  const { data: prod } = await supabase
    .from('product')
    .select('id, shop:shop!inner(seller_id)')
    .eq('id', productId)
    .maybeSingle();
  if (!prod) return;

  const sizes = formData.getAll('size').map((v) => String(v).trim());
  const colors = formData.getAll('color').map((v) => String(v).trim());
  const prices = formData.getAll('price_kzt').map((v) => Number(v));
  const stocks = formData.getAll('stock_qty').map((v) => Number(v));

  const rows: Array<{
    product_id: string;
    size: string | null;
    color: string | null;
    price_kzt: number | null;
    stock_qty: number;
  }> = [];

  const n = Math.max(sizes.length, colors.length, prices.length, stocks.length);
  for (let i = 0; i < n; i++) {
    const size = (sizes[i] ?? '').trim();
    const color = (colors[i] ?? '').trim();
    const priceRaw = Number.isFinite(prices[i]) ? (prices[i] as number) : 0;
    const stockRaw = Number.isFinite(stocks[i]) ? (stocks[i] as number) : 0;

    // Skip fully empty rows
    if (!size && !color && priceRaw <= 0 && stockRaw <= 0) continue;

    rows.push({
      product_id: productId,
      size: size || null,
      color: color || null,
      price_kzt: priceRaw > 0 ? Math.floor(priceRaw) : null,
      stock_qty: Math.max(0, Math.floor(stockRaw)),
    });
  }

  await supabase.from('product_variant').delete().eq('product_id', productId);
  if (rows.length > 0) {
    await supabase.from('product_variant').insert(rows);
  }

  revalidatePath(`/seller/products/${productId}`);
  revalidatePath(`/product/${productId}`);
}
