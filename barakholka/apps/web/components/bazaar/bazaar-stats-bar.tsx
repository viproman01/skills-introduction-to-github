'use client';

import { useEffect, useState } from 'react';
import type { Container } from './types';

export type BazaarStatsProps = { containers: Container[] };

export function BazaarStatsBar({ containers }: BazaarStatsProps) {
  const opened = containers.filter((c) => c.openNow).length;
  const total = containers.length;
  const live = containers.filter((c) => c.isLive).length;
  const totalViewers = containers.reduce((s, c) => s + c.viewers, 0);
  const lotsToday = Math.max(200, containers.reduce((s, c) => s + (c.deals % 30), 0)) + 2000;
  const newLots = Math.round(lotsToday * 0.05);
  const openedRecent = Math.max(3, Math.round(opened * 0.08));

  const [rate, setRate] = useState(498.2);
  useEffect(() => {
    const t = setInterval(() => {
      setRate((r) => +(r + (Math.random() - 0.5) * 0.1).toFixed(2));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-bazaar-line bg-bazaar-card px-4 py-3 md:grid-cols-4">
      <Stat
        label="Контейнеров открыто"
        value={`${opened}`}
        sub={total ? `/ ${total}` : undefined}
        hint={`+${openedRecent} за час`}
      />
      <Stat
        label="Лотов сегодня"
        value={lotsToday.toLocaleString('ru-RU')}
        hint={`+${newLots.toLocaleString('ru-RU')} новых`}
      />
      <Stat
        label="В эфире сейчас"
        value={`${live}`}
        sub="live"
        hint={`${totalViewers.toLocaleString('ru-RU')} ${plural(totalViewers, 'зритель', 'зрителя', 'зрителей')}`}
        dot
      />
      <Stat
        label="Курс ₸/$"
        value={rate.toFixed(2)}
        hint={'-1.4 ₸'}
        hintClass="text-bazaar-accent"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  hint,
  hintClass = 'text-bazaar-muted',
  dot,
}: {
  label: string;
  value: string;
  sub?: string;
  hint?: string;
  hintClass?: string;
  dot?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-bazaar-muted">
        {dot && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bazaar-live opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-bazaar-live" /></span>}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular-nums text-bazaar-ink">{value}</span>
        {sub && <span className="text-xs text-bazaar-muted">{sub}</span>}
      </div>
      {hint && <div className={`text-[11px] ${hintClass}`}>{hint}</div>}
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
