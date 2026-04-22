import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await getSupabaseServer();

  const [shopsTotal, shopsUnverified, productsTotal, productsHidden, reviewsTotal, leadsRecent] = await Promise.all([
    supabase.from('shop').select('id', { count: 'exact', head: true }),
    supabase.from('shop').select('id', { count: 'exact', head: true }).eq('is_verified', false),
    supabase.from('product').select('id', { count: 'exact', head: true }),
    supabase.from('product').select('id', { count: 'exact', head: true }).eq('is_available', false),
    supabase.from('review').select('id', { count: 'exact', head: true }),
    supabase.from('order_lead').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const tiles = [
    { label: 'Бутиков',           value: shopsTotal.count ?? 0,      href: '/admin/shops', hint: `${shopsUnverified.count ?? 0} без отметки` },
    { label: 'Товаров',           value: productsTotal.count ?? 0,   href: '/admin/products', hint: `${productsHidden.count ?? 0} скрытых` },
    { label: 'Отзывов',           value: reviewsTotal.count ?? 0,    href: '/admin/reviews' },
    { label: 'Новые заявки',      value: leadsRecent.count ?? 0,     href: '/admin', hint: 'не обработаны' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Сводка модерации</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Быстрый обзор состояния маркетплейса. Клик на плитку — открыть раздел.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t.label}</div>
            <div className="mt-1 text-3xl font-bold text-neutral-900">{t.value}</div>
            {t.hint && <div className="mt-1 text-xs text-neutral-500">{t.hint}</div>}
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
        <p>Политики RLS (миграция 0005) дают админу доступ ко всем записям в shop, product, review.</p>
        <p className="mt-1">Пометка «проверен» на бутике отображается публичной галочкой в шапке карточки и страницы.</p>
      </section>
    </div>
  );
}
