import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ProductForm } from '../product-form';
import { deleteProduct, updateProduct } from '../actions';
import { saveVariants } from '../variant-actions';
import { VariantsEditor } from '@/components/variants-editor';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string; error?: string }>;

type ProductRow = {
  id: string;
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
  media: { url: string; order_idx: number }[];
  shop: { seller_id: string } | null;
};

export default async function EditProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const seller = await requireSeller(`/seller/products/${id}`);
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('product')
    .select(
      'id, shop_id, category_id, section_id, title, description, price_kzt, condition, is_wholesale, min_wholesale_qty, is_available,' +
        ' media:product_media(url, order_idx),' +
        ' shop:shop!inner(seller_id)',
    )
    .eq('id', id)
    .eq('shop.seller_id', seller.userId)
    .maybeSingle();

  const product = data as unknown as ProductRow | null;
  if (!product) notFound();

  const photos = [...(product.media ?? [])].sort((a, b) => a.order_idx - b.order_idx).map((m) => m.url);

  const { data: variantData } = await supabase
    .from('product_variant')
    .select('id, size, color, price_kzt, stock_qty')
    .eq('product_id', product.id)
    .order('created_at');
  type Variant = { id: string; size: string | null; color: string | null; price_kzt: number | null; stock_qty: number };
  const variants = (variantData ?? []) as Variant[];

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundDelete = deleteProduct.bind(null, product.id);
  const boundSaveVariants = saveVariants.bind(null, product.id);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/seller/products" className="text-sm text-neutral-500 hover:text-brand">
          ← к списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{product.title}</h1>
        <div className="mt-1 text-sm text-neutral-500">
          <Link href={`/product/${product.id}`} target="_blank" className="hover:text-brand">
            Открыть публичную страницу ↗
          </Link>
        </div>
      </header>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Сохранено.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'title' ? 'Название обязательно.' : error}
        </div>
      )}

      <ProductForm
        action={boundUpdate}
        submitLabel="Сохранить"
        lockShop
        values={{
          shop_id: product.shop_id,
          category_id: product.category_id,
          section_id: product.section_id,
          title: product.title,
          description: product.description,
          price_kzt: product.price_kzt,
          condition: product.condition,
          is_wholesale: product.is_wholesale,
          min_wholesale_qty: product.min_wholesale_qty,
          is_available: product.is_available,
          photos,
        }}
      />

      <section className="border-t border-neutral-200 pt-6">
        <h2 className="mb-1 text-lg font-semibold">Варианты (размер × цвет)</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Добавьте конкретные размеры/цвета — покупатель сможет выбрать их на странице товара.
        </p>
        <VariantsEditor productId={product.id} initial={variants} action={boundSaveVariants} />
      </section>

      <form action={boundDelete} className="border-t border-neutral-200 pt-4">
        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
          Удалить товар
        </button>
      </form>
    </div>
  );
}
