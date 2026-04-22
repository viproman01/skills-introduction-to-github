import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Админка — Барахолка.kz' };

const nav = [
  { href: '/admin',          label: 'Сводка',  icon: '🛡️' },
  { href: '/admin/shops',    label: 'Бутики',  icon: '🏬' },
  { href: '/admin/products', label: 'Товары',  icon: '🏷️' },
  { href: '/admin/reviews',  label: 'Отзывы',  icon: '⭐' },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="-mx-4 -my-6 grid min-h-[calc(100vh-120px)] grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-r border-neutral-200 bg-neutral-900 px-3 py-5 text-neutral-300">
        <div className="mb-6 px-3">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Модерация</div>
          <div className="mt-1 truncate text-sm font-semibold text-white">{admin.email ?? 'admin'}</div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 hover:text-white"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-400 transition hover:text-white"
        >
          ← На сайт
        </Link>
      </aside>

      <main className="bg-neutral-50 p-6 md:p-8">{children}</main>
    </div>
  );
}
