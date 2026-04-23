'use client';

import type { Container, Filters, RowDef } from './types';

export type BazaarSidebarProps = {
  rows: RowDef[];
  capacities: Record<string, number>;
  containers: Container[];
  selectedRow: string | null;
  onRowClick: (slug: string | null) => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  counts: Record<string, number>;
};

export function BazaarSidebar({
  rows,
  capacities,
  containers,
  selectedRow,
  onRowClick,
  filters,
  onFiltersChange,
  counts,
}: BazaarSidebarProps) {
  const countOpenNow = containers.filter((c) => c.openNow).length;
  const countTorg = containers.filter((c) => c.torg).length;
  const countVideo = containers.filter((c) => c.hasVideo).length;
  const countLive = containers.filter((c) => c.isLive).length;
  const countWholesale = containers.filter((c) => c.isWholesale).length;

  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-bazaar-line bg-bazaar-card">
      <Section title="Ряды рынка">
        <ul className="flex flex-col gap-1">
          {rows.map((row) => {
            const count = counts[row.slug] ?? 0;
            const total = capacities[row.slug] ?? 24;
            const active = selectedRow === row.slug;
            return (
              <li key={row.slug}>
                <button
                  onClick={() => onRowClick(active ? null : row.slug)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-bazaar-accent bg-bazaar-accent/10'
                      : 'border-transparent bg-transparent hover:border-bazaar-line hover:bg-white',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold',
                      active ? 'bg-bazaar-accent text-bazaar-bg' : 'bg-bazaar-ink text-bazaar-bg',
                    ].join(' ')}
                  >
                    {row.letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-bazaar-ink">{row.name}</div>
                    <div className="text-xs text-bazaar-muted">{count} / {total} контейнеров</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Фильтры рынка">
        <div className="flex flex-col gap-2 text-sm">
          <Checkbox label="Открыт сейчас"      count={countOpenNow}   checked={filters.openNow}   onChange={(v) => set({ openNow: v })} />
          <Checkbox label="Торг уместен"       count={countTorg}      checked={filters.torg}      onChange={(v) => set({ torg: v })} />
          <Checkbox label="Видео от продавца"  count={countVideo}     checked={filters.video}     onChange={(v) => set({ video: v })} />
          <Checkbox label="Продавец в эфире"   count={countLive}      checked={filters.live}      onChange={(v) => set({ live: v })} dot />
          <Checkbox label="Оптом"              count={countWholesale} checked={filters.wholesale} onChange={(v) => set({ wholesale: v })} />
        </div>
      </Section>

      <Section title="Цена">
        <div className="flex flex-col gap-2">
          <div className="relative h-2 rounded-full bg-bazaar-line">
            <div
              className="absolute h-2 rounded-full bg-bazaar-accent"
              style={{
                left: `${((filters.priceMin - 1000) / 49000) * 100}%`,
                right: `${100 - ((filters.priceMax - 1000) / 49000) * 100}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-bazaar-muted">
            <span>{filters.priceMin.toLocaleString('ru-RU')} ₸</span>
            <span>{filters.priceMax.toLocaleString('ru-RU')} ₸</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <PriceInput
              value={filters.priceMin}
              onChange={(v) => set({ priceMin: Math.max(1000, Math.min(v, filters.priceMax - 100)) })}
            />
            <PriceInput
              value={filters.priceMax}
              onChange={(v) => set({ priceMax: Math.min(50000, Math.max(v, filters.priceMin + 100)) })}
            />
          </div>
        </div>
      </Section>

      <Section title="Рейтинг продавца">
        <div className="flex flex-wrap gap-2">
          <RatingChip active={filters.ratingMin === 4}   onClick={() => set({ ratingMin: filters.ratingMin === 4 ? 0 : 4 })}>4★+</RatingChip>
          <RatingChip active={filters.ratingMin === 4.5} onClick={() => set({ ratingMin: filters.ratingMin === 4.5 ? 0 : 4.5 })}>4.5★+</RatingChip>
          <RatingChip active={filters.ratingMin === 5}   onClick={() => set({ ratingMin: filters.ratingMin === 5 ? 0 : 5 })}>5★</RatingChip>
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-bazaar-line/60 px-4 py-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-bazaar-muted">{title}</div>
      {children}
    </section>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
  dot,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: (v: boolean) => void;
  dot?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-white">
      <span className="flex items-center gap-2">
        <span
          className={[
            'flex h-4 w-4 items-center justify-center rounded-sm border transition',
            checked ? 'border-bazaar-accent bg-bazaar-accent' : 'border-bazaar-line bg-white',
          ].join(' ')}
        >
          {checked && (
            <svg viewBox="0 0 16 16" width={10} height={10} stroke="#ffffff" strokeWidth={3} fill="none">
              <path d="M3 8.5L6.5 12L13 4" />
            </svg>
          )}
        </span>
        <span className="text-sm text-bazaar-ink">{label}</span>
        {dot && <span className="inline-block h-2 w-2 rounded-full bg-bazaar-live" />}
      </span>
      <span className="text-xs tabular-nums text-bazaar-muted">
        {count.toLocaleString('ru-RU')}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    </label>
  );
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
      className="w-full rounded-md border border-bazaar-line bg-white px-2 py-1.5 text-sm text-bazaar-ink outline-none focus:border-bazaar-accent"
    />
  );
}

function RatingChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-bazaar-ink bg-bazaar-ink text-bazaar-bg'
          : 'border-bazaar-line bg-white text-bazaar-ink hover:border-bazaar-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
