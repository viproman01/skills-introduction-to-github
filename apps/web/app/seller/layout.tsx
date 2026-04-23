import Link from 'next/link';
import { requireSeller } from '@/lib/auth';

export const metadata = { title: 'Кабинет продавца — Барахолка.kz' };

const nav = [
  { href: '/seller',           label: 'Дашборд',   icon: '📊', exact: true  },
  { href: '/seller/shops',     label: 'Мои бутики', icon: '🏬', exact: false },
  { href: '/seller/products',  label: 'Товары',     icon: '🏷️', exact: false },
  { href: '/seller/leads',     label: 'Заявки',     icon: '📨', exact: false },
] as const;

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const seller = await requireSeller();

  return (
    <div className="-mx-4 -my-6 grid min-h-[calc(100vh-120px)] grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-neutral-200 bg-white px-3 py-5">
        <div className="mb-6 px-3">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Кабинет</div>
          <div className="mt-1 truncate text-sm font-semibold">{seller.fullName}</div>
          <div className="truncate text-xs text-neutral-500">{seller.email}</div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition hover:bg-brand-soft hover:text-brand"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <form action="/logout" method="post" className="mt-6 px-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <span>🚪</span>
            <span>Выйти</span>
          </button>
        </form>
      </aside>

      <main className="bg-neutral-50 p-6 md:p-8">{children}</main>
    </div>
  );
}
