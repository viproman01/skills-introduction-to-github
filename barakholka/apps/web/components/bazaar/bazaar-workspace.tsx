'use client';

import { useMemo, useState } from 'react';
import type { ShopGeo } from '@/lib/types';
import { BazaarPlan } from './bazaar-plan';
import { BazaarSidebar } from './bazaar-sidebar';
import { BazaarSellerPanel } from './bazaar-seller-panel';
import { BazaarStatsBar } from './bazaar-stats-bar';
import { BazaarTabs } from './bazaar-tabs';
import {
  DEFAULT_FILTERS,
  ROW_CAPACITY,
  ROW_DEFS,
  enrich,
  matchesFilters,
  type Container,
  type Filters,
  type RowDef,
} from './types';

export type BazaarWorkspaceProps = {
  shops: ShopGeo[];
  rows?: RowDef[];
  capacities?: Record<string, number>;
  marketName?: string;
};

export function BazaarWorkspace({
  shops,
  rows = ROW_DEFS,
  capacities = ROW_CAPACITY,
  marketName = 'Барахолка',
}: BazaarWorkspaceProps) {
  const containers: Container[] = useMemo(() => shops.map((s) => enrich(s, rows)), [shops, rows]);

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      if (!matchesFilters(c, filters)) return false;
      if (selectedRow && c.rowSlug !== selectedRow) return false;
      return true;
    });
  }, [containers, filters, selectedRow]);

  const countsByRow: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of containers.filter((c) => matchesFilters(c, filters))) {
      m[c.rowSlug] = (m[c.rowSlug] ?? 0) + 1;
    }
    return m;
  }, [containers, filters]);

  const selected = selectedId ? containers.find((c) => c.id === selectedId) ?? null : null;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-120px)] flex-col bg-bazaar-bg text-bazaar-ink">
      <BazaarTabs />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr_380px]">
        <BazaarSidebar
          rows={rows}
          capacities={capacities}
          containers={containers}
          selectedRow={selectedRow}
          onRowClick={(s) => { setSelectedRow(s); setSelectedId(null); }}
          filters={filters}
          onFiltersChange={setFilters}
          counts={countsByRow}
        />

        <section className="flex min-h-0 flex-col">
          <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-bazaar-muted">
                <span>План · {marketName}</span>
                <span className="flex items-center gap-1 rounded-full bg-bazaar-live/15 px-2 py-0.5 text-[10px] font-bold text-bazaar-live">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bazaar-live opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bazaar-live" />
                  </span>
                  LIVE
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold leading-tight md:text-3xl">
                Весь рынок <span className="text-bazaar-muted">в одном клике</span>
              </h1>
              <p className="mt-1 max-w-md text-sm text-bazaar-muted">
                Клик по контейнеру — карточка продавца справа. Зелёный = открыт, оранжевый = хит, мигающий = в эфире.
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button className="flex items-center gap-1.5 rounded-lg border border-bazaar-line bg-white px-3.5 py-2 font-medium text-bazaar-ink transition hover:border-bazaar-ink">
                <span>🔍</span> Найти контейнер
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-bazaar-line bg-white px-3.5 py-2 font-medium text-bazaar-ink transition hover:border-bazaar-ink">
                <span>🧭</span> Построить путь
              </button>
            </div>
          </header>

          <div className="flex-1 px-5">
            <BazaarPlan
              rows={rows}
              capacities={capacities}
              containers={filtered}
              selectedRow={selectedRow}
              selectedContainerId={selectedId}
              hoveredContainerId={hoveredId}
              onRowClick={(s) => { setSelectedRow(s); setSelectedId(null); }}
              onContainerClick={(id) => setSelectedId(id)}
              onContainerHover={setHoveredId}
            />
          </div>

          <BazaarStatsBar containers={containers} />
        </section>

        <BazaarSellerPanel
          container={selected}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
