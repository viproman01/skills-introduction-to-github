import Link from 'next/link';
import { ProductForm } from '../product-form';
import { createProduct } from '../actions';

export const metadata = { title: 'Новый товар — Барахолка.kz' };

type SearchParams = Promise<{ shop?: string; error?: string }>;

export default async function NewProductPage({ searchParams }: { searchParams: SearchParams }) {
  const { shop, error } = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/seller/products" className="text-sm text-neutral-500 hover:text-brand">
          ← к списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Новый товар</h1>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'title' ? 'Название обязательно.' : error === 'shop' ? 'Выберите бутик.' : error}
        </div>
      )}

      <ProductForm
        action={createProduct}
        submitLabel="Добавить"
        values={{ shop_id: shop, condition: 'new', is_available: true, is_wholesale: false }}
      />
    </div>
  );
}
