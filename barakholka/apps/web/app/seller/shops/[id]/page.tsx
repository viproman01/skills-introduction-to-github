import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ShopForm } from '../shop-form';
import { deleteShop, updateShop } from '../actions';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string; error?: string }>;

type ShopRow = {
  id: string;
  name: string;
  description: string | null;
  sector_id: string | null;
  row_number: string | null;
  place_number: string | null;
  photos: string[] | null;
  is_active: boolean;
};

export default async function EditShopPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const seller = await requireSeller(`/seller/shops/${id}`);
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('shop')
    .select('id, name, description, sector_id, row_number, place_number, photos, is_active')
    .eq('id', id)
    .eq('seller_id', seller.userId)
    .maybeSingle();

  const shop = data as ShopRow | null;
  if (!shop) notFound();

  const boundUpdate = updateShop.bind(null, shop.id);
  const boundDelete = deleteShop.bind(null, shop.id);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/seller/shops" className="text-sm text-neutral-500 hover:text-brand">
          ← к списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{shop.name}</h1>
        <div className="mt-1 flex gap-4 text-sm text-neutral-500">
          <Link href={`/seller/products?shop=${shop.id}`} className="hover:text-brand">
            Товары этого бутика →
          </Link>
          <Link href={`/shop/${shop.id}`} target="_blank" className="hover:text-brand">
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
          {error === 'name' ? 'Название обязательно.' : error}
        </div>
      )}

      <ShopForm
        action={boundUpdate}
        submitLabel="Сохранить"
        values={{
          name: shop.name,
          description: shop.description,
          sector_id: shop.sector_id,
          row_number: shop.row_number,
          place_number: shop.place_number,
          photos: shop.photos ?? [],
          is_active: shop.is_active,
        }}
      />

      <form action={boundDelete} className="border-t border-neutral-200 pt-4">
        <button
          type="submit"
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Удалить бутик
        </button>
      </form>
    </div>
  );
}
