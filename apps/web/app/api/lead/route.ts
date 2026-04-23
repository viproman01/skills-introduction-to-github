import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

type Channel = 'whatsapp' | 'telegram' | 'phone' | 'kaspi';
const CHANNELS: readonly Channel[] = ['whatsapp', 'telegram', 'phone', 'kaspi'];

function isChannel(v: unknown): v is Channel {
  return typeof v === 'string' && (CHANNELS as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  let productId: string | null = null;
  let variantId: string | null = null;
  let buyerName: string | null = null;
  let buyerPhone: string | null = null;
  let message: string | null = null;
  let channel: Channel = 'phone';

  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    productId = typeof body.product_id === 'string' ? body.product_id : null;
    variantId = typeof body.variant_id === 'string' && body.variant_id ? body.variant_id : null;
    buyerName = typeof body.buyer_name === 'string' ? body.buyer_name : null;
    buyerPhone = typeof body.buyer_phone === 'string' ? body.buyer_phone : null;
    message = typeof body.message === 'string' ? body.message : null;
    if (isChannel(body.channel)) channel = body.channel;
  } else {
    const form = await request.formData();
    productId = (form.get('product_id') as string | null) ?? null;
    const v = form.get('variant_id');
    variantId = typeof v === 'string' && v ? v : null;
    buyerName = (form.get('buyer_name') as string | null) ?? null;
    buyerPhone = (form.get('buyer_phone') as string | null) ?? null;
    message = (form.get('message') as string | null) ?? null;
    const ch = form.get('channel');
    if (isChannel(ch)) channel = ch;
  }

  if (!productId || !buyerName || !buyerPhone) {
    return NextResponse.json({ error: 'product_id, buyer_name, buyer_phone are required' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('order_lead').insert({
    product_id: productId,
    variant_id: variantId,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    message: message || null,
    channel,
    status: 'new',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL(`/product/${productId}?lead=ok`, request.url), { status: 303 });
}
