import Link from 'next/link';
import { ShopForm } from '../shop-form';
import { createShop } from '../actions';

export const metadata = { title: 'Новый бутик — Барахолка.kz' };

type SearchParams = Promise<{ error?: string }>;

export default async function NewShopPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/seller/shops" className="text-sm text-neutral-500 hover:text-brand">
          ← к списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Новый бутик</h1>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'name' ? 'Название обязательно.' : error}
        </div>
      )}

      <ShopForm action={createShop} submitLabel="Создать" />
    </div>
  );
}
