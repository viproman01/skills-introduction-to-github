import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import {
  BoxIcon,
  CartIcon,
  ChevronDownIcon,
  HeartIcon,
  MapPinIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '@/components/icons';

export const metadata: Metadata = {
  title: 'Барахолка — маркетплейс Алматы',
  description: 'Магазины и товары с Барахолки Алматы. Карта, поиск, связь с продавцом.',
};

const categories = [
  { href: '/shops', label: 'Магазины', emoji: '🏬' },
  { href: '/search?q=одежда', label: 'Одежда', emoji: '👕' },
  { href: '/search?q=обувь', label: 'Обувь', emoji: '👟' },
  { href: '/search?q=аксессуары', label: 'Аксессуары', emoji: '👜' },
  { href: '/search?q=детям', label: 'Детям', emoji: '🧸' },
  { href: '/search?q=опт', label: 'Опт', emoji: '📦' },
  { href: '/map', label: 'На карте', emoji: '📍' },
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
          {/* Row 1: logo · catalog · search · user nav */}
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex shrink-0 items-baseline text-2xl font-extrabold tracking-tight">
              <span className="text-brand">Барахолка</span>
              <span className="text-neutral-900">.kz</span>
            </Link>

            <Link
              href="/shops"
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-hover md:inline-flex"
            >
              <MenuIcon size={18} />
              Каталог
            </Link>

            <form action="/search" method="get" className="flex flex-1 items-stretch overflow-hidden rounded-lg border-2 border-brand">
              <div className="hidden items-center gap-1 border-r border-neutral-200 bg-white px-3 text-sm text-neutral-700 md:flex">
                Везде
                <ChevronDownIcon size={14} />
              </div>
              <input
                name="q"
                placeholder="Искать на Барахолке"
                className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400"
              />
              <button
                type="submit"
                aria-label="Найти"
                className="flex shrink-0 items-center justify-center bg-brand px-4 text-brand-fg hover:bg-brand-hover"
              >
                <SearchIcon size={20} />
              </button>
            </form>

            <nav className="hidden shrink-0 items-center gap-1 md:flex">
              <IconLink href="/login" icon={<UserIcon />} label="Войти" />
              <IconLink href="/orders" icon={<BoxIcon />} label="Заказы" />
              <IconLink href="/favorites" icon={<HeartIcon />} label="Избранное" />
              <IconLink href="/cart" icon={<CartIcon />} label="Корзина" />
            </nav>
          </div>

          {/* Row 2: category chips · city */}
          <div className="border-t border-neutral-100">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
              <div className="chip-strip flex flex-1 items-center gap-1 overflow-x-auto text-sm">
                <Link
                  href="/search?q=рассрочка"
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-accent hover:bg-neutral-100"
                >
                  <span>%</span>
                  <span className="font-medium">Рассрочка 0-0-12</span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-neutral-700 hover:bg-neutral-100"
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>
              <button className="hidden shrink-0 items-center gap-1.5 text-sm text-neutral-700 hover:text-brand md:flex">
                <MapPinIcon size={16} />
                <span className="font-medium">Алматы</span>
                <span className="text-brand">· Укажите адрес</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>

        <footer className="mt-10 border-t border-neutral-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-neutral-500">
            © Барахолка.kz · Алматы · MVP
          </div>
        </footer>
      </body>
    </html>
  );
}

function IconLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-neutral-700 hover:text-brand"
    >
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
