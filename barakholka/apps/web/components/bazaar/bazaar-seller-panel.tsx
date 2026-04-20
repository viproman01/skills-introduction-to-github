'use client';

import Link from 'next/link';
import { formatKzt, type Container } from './types';

export type BazaarSellerPanelProps = {
  container: Container | null;
  onClose: () => void;
};

export function BazaarSellerPanel({ container, onClose }: BazaarSellerPanelProps) {
  if (!container) return <EmptyState />;

  const c = container;
  const avatarLetter = c.sellerName.slice(0, 1);

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-bazaar-line bg-bazaar-panel">
      <header className="flex items-center justify-between border-b border-bazaar-line/60 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-bazaar-muted">
          <span className="rounded bg-bazaar-card px-2 py-0.5">Ряд {c.rowLetter}</span>
          <span>·</span>
          <span className="rounded bg-bazaar-card px-2 py-0.5">Конт. {c.containerNo}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-7 w-7 items-center justify-center rounded-md text-bazaar-muted hover:bg-bazaar-card hover:text-bazaar-ink"
        >
          ✕
        </button>
      </header>

      <div className="px-4 py-4">
        <h2 className="text-xl font-semibold leading-tight text-bazaar-ink">{c.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {c.isWholesale && <Chip>опт от 10</Chip>}
          {c.torg && <Chip>торг</Chip>}
          {c.delivery && <Chip>доставка</Chip>}
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-bazaar-line bg-bazaar-card p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bazaar-ink text-lg font-bold text-bazaar-bg">
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-bazaar-ink">{c.sellerName}</div>
          <div className="text-xs text-bazaar-muted">
            ★ {c.rating.toFixed(1)} · {c.reviews} отзывов · {c.yearsOnMarket} {plural(c.yearsOnMarket, 'год', 'года', 'лет')}
          </div>
        </div>
        {c.isLive && (
          <span className="flex items-center gap-1 rounded-full bg-bazaar-live/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-bazaar-live">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bazaar-live opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bazaar-live" />
            </span>
            В эфире
          </span>
        )}
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-bazaar-dark">
        <div className="relative flex aspect-video items-center justify-center text-bazaar-bg/90">
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-bazaar-live px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-bazaar-bg">
            👁 {c.viewers || '—'}
          </div>
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bazaar-bg/15 text-xl">
              {c.isLive ? '▶' : '📹'}
            </div>
            <div className="text-xs text-bazaar-bg/75">
              {c.isLive ? '[ видео из контейнера ]' : '[ записи и обзоры ]'}
            </div>
            <div className="text-sm font-medium">
              {c.isLive ? 'разбираем новый приход' : 'посмотреть витрину'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-bazaar-muted">
            Витрина · {c.deals % 50 + 20} лотов
          </div>
          <Link href={`/shop/${c.id}`} className="text-xs font-medium text-bazaar-accent hover:underline">
            смотреть всё →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {c.products.slice(0, 5).map((p, i) => (
            <div
              key={i}
              className="flex aspect-square flex-col items-center justify-end rounded-lg p-2 text-center text-[11px] font-medium text-bazaar-ink"
              style={{
                background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 20% 88%), hsl(${(i * 47 + 30) % 360} 30% 78%))`,
              }}
            >
              {p}
            </div>
          ))}
          <div className="flex aspect-square items-center justify-center rounded-lg bg-bazaar-card text-sm font-semibold text-bazaar-muted">
            +{(c.deals % 40) + 10}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <Stat label="Открыто" value={c.openHours} />
        <Stat label="Чек" value={formatKzt(c.avgCheck)} />
        <Stat label="Сделок" value={c.deals.toLocaleString('ru-RU')} />
        <Stat label="Ответ" value={`~${c.responseMin} мин`} />
      </div>

      <div className="mt-auto p-4">
        <Link
          href={`/shop/${c.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-bazaar-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-bazaar-accent/90"
        >
          → Открыть контейнер
        </Link>
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <aside className="flex h-full w-full flex-col items-center justify-center border-l border-bazaar-line bg-bazaar-panel p-8 text-center">
      <div className="text-4xl">👆</div>
      <h3 className="mt-3 text-base font-semibold text-bazaar-ink">Кликни по контейнеру</h3>
      <p className="mt-1 max-w-xs text-sm text-bazaar-muted">
        Выбери клетку на плане — справа откроется карточка продавца: товары, LIVE-видео, контакты, сделки.
      </p>
    </aside>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-bazaar-line bg-bazaar-card px-2.5 py-1 text-xs text-bazaar-ink">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bazaar-line bg-bazaar-card px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-bazaar-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-bazaar-ink">{value}</div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
