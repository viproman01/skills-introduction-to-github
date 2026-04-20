'use client';

import Link from 'next/link';

const TABS = [
  { n: '01', label: 'Главная',         href: '/',              active: false },
  { n: '02', label: 'Каталог',          href: '/shops',         active: false },
  { n: '03', label: 'Карточка товара',  href: '/search',        active: false },
  { n: '04', label: 'Продавец',         href: '/shops',         active: false },
  { n: '05', label: 'Опт',              href: '/search?q=опт',  active: false },
] as const;

export function BazaarTabs() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-bazaar-line bg-bazaar-bg px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <Link
          href="/map"
          className="flex items-center gap-2 rounded-md bg-bazaar-accent px-3 py-1.5 font-semibold text-white"
        >
          <span className="font-mono text-[11px] opacity-70">00</span>
          <span>План базара</span>
        </Link>
        {TABS.map((t) => (
          <Link
            key={t.n}
            href={t.href}
            className="flex items-center gap-2 rounded-md bg-bazaar-ink/90 px-3 py-1.5 font-medium text-bazaar-bg/90 hover:bg-bazaar-ink"
          >
            <span className="font-mono text-[11px] opacity-60">{t.n}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <LangToggle />
        <MapToggle />
      </div>
    </div>
  );
}

function LangToggle() {
  return (
    <div className="flex overflow-hidden rounded-md border border-bazaar-line text-[11px] font-semibold uppercase">
      <button className="bg-white px-2.5 py-1 text-bazaar-ink">РУС</button>
      <button className="bg-bazaar-card px-2.5 py-1 text-bazaar-muted">ҚАЗ</button>
    </div>
  );
}

function MapToggle() {
  return (
    <button className="flex items-center gap-2 rounded-md border border-bazaar-line bg-white px-2.5 py-1">
      <span className="relative flex h-4 w-7 items-center rounded-full bg-bazaar-accent">
        <span className="absolute right-0.5 h-3 w-3 rounded-full bg-white" />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-bazaar-ink">Карта</span>
    </button>
  );
}
