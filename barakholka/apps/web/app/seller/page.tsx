import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';

export default async function SellerDashboard() {
  const seller = await requireSeller();
  const supabase = await getSupabaseServer();

  const [shopsRes, productsRes, leadsRes, newLeadsRes] = await Promise.all([
    supabase.from('shop').select('id', { count: 'exact', head: true }).eq('seller_id', seller.userId),
    supabase
      .from('product')
      .select('id, shop!inner(seller_id)', { count: 'exact', head: true })
      .eq('shop.seller_id', seller.userId),
    supabase
      .from('order_lead')
      .select('id, product!inner(shop!inner(seller_id))', { count: 'exact', head: true })
      .eq('product.shop.seller_id', seller.userId),
    supabase
      .from('order_lead')
      .select('id, product!inner(shop!inner(seller_id))', { count: 'exact', head: true })
      .eq('product.shop.seller_id', seller.userId)
      .eq('status', 'new'),
  ]);

  const shopsCount = shopsRes.count ?? 0;
  const productsCount = productsRes.count ?? 0;
  const leadsCount = leadsRes.count ?? 0;
  const newLeadsCount = newLeadsRes.count ?? 0;

  const tiles = [
    { label: 'Бутиков',         value: shopsCount,    href: '/seller/shops',    cta: shopsCount === 0 ? '+ Открыть первый' : 'Управлять' },
    { label: 'Товаров',         value: productsCount, href: '/seller/products', cta: 'Управлять' },
    { label: 'Заявок',          value: leadsCount,    href: '/seller/leads',    cta: 'Посмотреть' },
    { label: 'Новых заявок',    value: newLeadsCount, href: '/seller/leads?status=new', cta: newLeadsCount > 0 ? 'Ответить →' : 'Пусто' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Добрый день, {seller.fullName.split(' ')[0] ?? seller.fullName} 👋</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Это ваш кабинет продавца. Добавляйте бутики, товары и отвечайте покупателям.
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
            <div className="mt-2 text-xs font-medium text-brand">{t.cta}</div>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold">С чего начать</h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm text-neutral-700">
          <Step done={shopsCount > 0}>
            Открыть первый бутик в{' '}
            <Link href="/seller/shops/new" className="font-medium text-brand hover:underline">
              /seller/shops/new
            </Link>
          </Step>
          <Step done={productsCount > 0}>
            Добавить товары в{' '}
            <Link href="/seller/products/new" className="font-medium text-brand hover:underline">
              /seller/products/new
            </Link>
          </Step>
          <Step done={leadsCount > 0}>Начать отвечать покупателям в /seller/leads</Step>
        </ol>
      </section>
    </div>
  );
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={done ? 'text-brand' : 'text-neutral-400'}>{done ? '✓' : '○'}</span>
      <span className={done ? 'text-neutral-400 line-through' : ''}>{children}</span>
    </li>
  );
}
