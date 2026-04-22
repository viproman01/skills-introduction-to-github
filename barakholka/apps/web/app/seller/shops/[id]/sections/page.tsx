import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string }>;

type Section = {
  id: string;
  name: string;
  slug: string;
  order_idx: number;
  is_visible: boolean;
};

export default async function SectionsList({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id: shopId } = await params;
  const { saved } = await searchParams;
  const seller = await requireSeller(`/seller/shops/${shopId}/sections`);
  const supabase = await getSupabaseServer();

  const { data: shopData } = await supabase
    .from('shop')
    .select('id, name')
    .eq('id', shopId)
    .eq('seller_id', seller.userId)
    .maybeSingle();
  if (!shopData) notFound();
  const shop = shopData as { id: string; name: string };

  const { data } = await supabase
    .from('shop_section')
    .select('id, name, slug, order_idx, is_visible')
    .eq('shop_id', shopId)
    .order('order_idx');
  const sections = (data ?? []) as Section[];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href={`/seller/shops/${shopId}`} className="text-sm text-neutral-500 hover:text-brand">
          ← {shop.name}
        </Link>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Разделы бутика</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Собственные коллекции («Зима», «Новинки», «Скидки» и т.п.). Товары можно привязывать к разделу.
            </p>
          </div>
          <Link
            href={`/seller/shops/${shopId}/sections/new`}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
          >
            + Новый раздел
          </Link>
        </div>
      </header>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Сохранено.
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          Разделов пока нет. Добавьте первый — он появится на публичной странице бутика.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sections.map((s) => (
            <li key={s.id}>
              <Link
                href={`/seller/shops/${shopId}/sections/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-brand"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    {!s.is_visible && (
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">скрыт</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">/{s.slug}</div>
                </div>
                <div className="text-xs text-neutral-400">{s.order_idx}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
