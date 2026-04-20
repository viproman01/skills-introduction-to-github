'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapView, type MapViewHandle } from './map-view';
import { ShopList } from './shop-list';
import { FloorPlan } from './floor-plan';
import type { ShopGeo } from '@/lib/types';

type Filter = 'all' | 'verified';
type View = 'map' | 'plan';

export function MapExplorer({ shops }: { shops: ShopGeo[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialZone = searchParams.get('p');
  const initialView: View = searchParams.get('v') === 'plan' ? 'plan' : 'map';

  const [view, setView] = useState<View>(initialView);
  const [selectedZone, setSelectedZone] = useState<string | null>(initialZone);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [webglMissing, setWebglMissing] = useState(false);
  const mapRef = useRef<MapViewHandle | null>(null);

  // Sync URL with view + selected pavilion
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedZone) params.set('p', selectedZone);
    if (view !== 'map') params.set('v', view);
    const qs = params.toString();
    router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, view]);

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      if (filter === 'verified' && !s.is_verified) return false;
      if (selectedZone && s.zone_slug !== selectedZone) return false;
      return true;
    });
  }, [shops, filter, selectedZone]);

  const selectedZoneName = useMemo(() => {
    if (!selectedZone) return null;
    return shops.find((s) => s.zone_slug === selectedZone)?.zone_name ?? selectedZone;
  }, [shops, selectedZone]);

  const groupedByZone = useMemo(() => {
    const groups = new Map<string, { name: string; items: ShopGeo[] }>();
    for (const s of filtered) {
      const key = s.zone_slug ?? '__unknown';
      const name = s.zone_name ?? 'Без павильона';
      if (!groups.has(key)) groups.set(key, { name, items: [] });
      groups.get(key)!.items.push(s);
    }
    return Array.from(groups.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name, 'ru'));
  }, [filtered]);

  const onZoneClick = useCallback((slug: string | null) => {
    setSelectedZone(slug);
    setSelectedShop(null);
  }, []);

  const onShopClick = useCallback((id: string) => {
    setSelectedShop(id);
  }, []);

  const onShopHover = useCallback((id: string | null) => {
    setHoveredShop(id);
  }, []);

  const reset = useCallback(() => {
    setSelectedZone(null);
    setSelectedShop(null);
    setFilter('all');
    if (view === 'map') mapRef.current?.resetView();
  }, [view]);

  const onMapReady = useCallback(() => {
    if (initialZone) mapRef.current?.flyToZone(initialZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMapUnsupported = useCallback(() => {
    setWebglMissing(true);
    setView('plan');
  }, []);

  return (
    <div className="-mx-4 -my-6 flex flex-col md:h-[calc(100vh-180px)] md:flex-row">
      {/* Left: side panel */}
      <aside className="order-2 flex w-full flex-col border-t border-neutral-200 bg-white md:order-1 md:w-96 md:border-r md:border-t-0">
        <div className="border-b border-neutral-100 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <h1 className="text-lg font-semibold">Бутики</h1>
            <span className="text-sm text-neutral-500">{filtered.length} из {shops.length}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Chip active={filter === 'all'}      onClick={() => setFilter('all')}>Все</Chip>
            <Chip active={filter === 'verified'} onClick={() => setFilter('verified')}>Проверенные</Chip>
            {(selectedZone || filter !== 'all') && (
              <button
                onClick={reset}
                className="ml-auto rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-500"
              >
                ✕ Сбросить
              </button>
            )}
          </div>
          {selectedZoneName && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-xs text-brand">
              📍 {selectedZoneName}
            </div>
          )}
        </div>

        <div className="max-h-[55vh] flex-1 overflow-y-auto md:max-h-none">
          {selectedZone ? (
            <ShopList
              shops={filtered}
              selectedShopId={selectedShop}
              onShopHover={onShopHover}
              onShopClick={onShopClick}
            />
          ) : (
            <div className="divide-y divide-neutral-100">
              {groupedByZone.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500">
                  Ничего не найдено. Запусти <code>pnpm seed</code>, чтобы заполнить базу.
                </div>
              ) : (
                groupedByZone.map(([slug, { name, items }]) => (
                  <section key={slug}>
                    <button
                      onClick={() => slug !== '__unknown' && setSelectedZone(slug)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-900">{name}</span>
                      <span className="text-xs text-neutral-500">{items.length} магазин(ов)</span>
                    </button>
                    <ShopList
                      shops={items.slice(0, 3)}
                      selectedShopId={selectedShop}
                      onShopHover={onShopHover}
                      onShopClick={onShopClick}
                    />
                    {items.length > 3 && slug !== '__unknown' && (
                      <button
                        onClick={() => setSelectedZone(slug)}
                        className="block w-full px-4 py-2 text-center text-xs font-medium text-brand hover:bg-neutral-50"
                      >
                        ещё {items.length - 3} в павильоне →
                      </button>
                    )}
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Right: map / plan */}
      <div className="relative order-1 flex h-[55vh] flex-1 flex-col md:order-2 md:h-auto">
        {/* View switcher */}
        <div className="absolute left-3 top-3 z-10 inline-flex overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-sm">
          <ViewBtn active={view === 'map'}  onClick={() => setView('map')}  disabled={webglMissing}>🗺️ Карта</ViewBtn>
          <ViewBtn active={view === 'plan'} onClick={() => setView('plan')}>📐 План</ViewBtn>
        </div>

        {webglMissing && view === 'map' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-6 text-center text-sm text-neutral-700">
            <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
              <div className="font-semibold text-neutral-900">Карта недоступна</div>
              <p className="mt-1 text-neutral-600">
                Браузер не отдаёт WebGL — переключись на «📐 План» или открой страницу в Chrome / Safari с включённой
                аппаратной графикой.
              </p>
              <button
                onClick={() => setView('plan')}
                className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
              >
                Переключиться на план
              </button>
            </div>
          </div>
        )}

        {view === 'map' ? (
          <MapView
            ref={mapRef}
            shops={shops}
            selectedZoneSlug={selectedZone}
            selectedShopId={selectedShop}
            hoveredShopId={hoveredShop}
            onZoneClick={onZoneClick}
            onShopClick={onShopClick}
            onShopHover={onShopHover}
            onReady={onMapReady}
            onUnsupported={onMapUnsupported}
          />
        ) : (
          <FloorPlan
            shops={shops}
            selectedZoneSlug={selectedZone}
            selectedShopId={selectedShop}
            hoveredShopId={hoveredShop}
            onZoneClick={onZoneClick}
            onShopClick={onShopClick}
            onShopHover={onShopHover}
          />
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs transition',
        active ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ViewBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'px-3 py-1.5 text-xs font-medium transition',
        active ? 'bg-brand text-brand-fg' : 'bg-white text-neutral-700 hover:bg-neutral-50',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
