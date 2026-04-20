'use client';

import { useMemo } from 'react';
import type { ShopGeo } from '@/lib/types';

export type FloorPlanProps = {
  shops: ShopGeo[];
  selectedZoneSlug: string | null;
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onZoneClick: (slug: string | null) => void;
  onShopClick: (id: string) => void;
  onShopHover: (id: string | null) => void;
};

type ZoneDef = {
  slug: string;
  name: string;
  color: string;
  capacity: number;
};

const ZONES: ZoneDef[] = [
  { slug: 'olzha',     name: 'Олжа',      color: '#f59e0b', capacity: 30 },
  { slug: 'adem',      name: 'Адем',      color: '#ef4444', capacity: 50 },
  { slug: 'almaly',    name: 'Алмалы',    color: '#10b981', capacity: 24 },
  { slug: 'merkur',    name: 'Меркур',    color: '#3b82f6', capacity: 24 },
  { slug: 'kulanda',   name: 'Куланды',   color: '#a855f7', capacity: 18 },
  { slug: 'bolashak',  name: 'Болашак',   color: '#eab308', capacity: 30 },
  { slug: 'aina-sulu', name: 'Айна-Сулу', color: '#14b8a6', capacity: 24 },
  { slug: 'bereket',   name: 'Берекет',   color: '#f97316', capacity: 18 },
];

const COLS = 4;
const CELL = 28;
const PAD = 8;
const HEADER_H = 28;

export function FloorPlan({
  shops,
  selectedZoneSlug,
  selectedShopId,
  hoveredShopId,
  onZoneClick,
  onShopClick,
  onShopHover,
}: FloorPlanProps) {
  // Group occupied shops by zone, capped at zone capacity
  const occupiedByZone = useMemo(() => {
    const map = new Map<string, ShopGeo[]>();
    for (const z of ZONES) map.set(z.slug, []);
    for (const s of shops) {
      if (!s.zone_slug) continue;
      const arr = map.get(s.zone_slug);
      if (arr) arr.push(s);
    }
    return map;
  }, [shops]);

  // Compute geometry for each zone block: 5×6 grid of cells, fits inside a card
  const blocks = ZONES.map((z) => {
    const occ = occupiedByZone.get(z.slug) ?? [];
    const cellsPerRow = 5;
    const rows = Math.ceil(z.capacity / cellsPerRow);
    const w = cellsPerRow * CELL + 2 * PAD;
    const h = HEADER_H + rows * CELL + 2 * PAD;
    return { zone: z, occ, rows, cellsPerRow, w, h };
  });

  // Pack into a 4-col grid
  const colW = Math.max(...blocks.map((b) => b.w)) + 16;
  const rowH = Math.max(...blocks.map((b) => b.h)) + 16;
  const totalRows = Math.ceil(blocks.length / COLS);
  const vbW = COLS * colW + 32;
  const vbH = totalRows * rowH + 32;

  const totalCapacity = ZONES.reduce((s, z) => s + z.capacity, 0);
  const totalOccupied = shops.filter((s) => s.zone_slug).length;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 text-sm">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <span className="font-medium">План базара</span>
          <span className="text-neutral-500"> · {ZONES.length} корпусов · {totalCapacity} бутиков</span>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <Legend color="#005bff" label="Занято" />
          <span className="mx-2 text-neutral-300">·</span>
          <Legend color="#e5e5e5" label="Свободно" outline />
          <span className="ml-2 text-neutral-500">Занято: {totalOccupied}/{totalCapacity}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          {ZONES.map((z) => {
            const occ = occupiedByZone.get(z.slug)?.length ?? 0;
            return (
              <button
                key={z.slug}
                onClick={() => onZoneClick(selectedZoneSlug === z.slug ? null : z.slug)}
                className={[
                  'flex items-center gap-1.5 rounded-md border px-2 py-1 transition',
                  selectedZoneSlug === z.slug ? 'border-brand bg-brand-soft' : 'border-neutral-200 hover:border-neutral-400',
                ].join(' ')}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                <span>{z.name}</span>
                <span className="text-neutral-500">{occ}/{z.capacity}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-neutral-100 p-4">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="mx-auto block h-auto w-full max-w-5xl"
          style={{ shapeRendering: 'crispEdges' }}
        >
          {blocks.map((b, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = 16 + col * colW;
            const y = 16 + row * rowH;
            const isSelected = selectedZoneSlug === b.zone.slug;
            const isDimmed = !!selectedZoneSlug && !isSelected;

            return (
              <g
                key={b.zone.slug}
                transform={`translate(${x}, ${y})`}
                opacity={isDimmed ? 0.35 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => onZoneClick(isSelected ? null : b.zone.slug)}
              >
                {/* card */}
                <rect
                  x={0}
                  y={0}
                  width={b.w}
                  height={b.h}
                  rx={10}
                  fill="#ffffff"
                  stroke={isSelected ? '#005bff' : '#e5e5e5'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {/* corpus header */}
                <rect x={0} y={0} width={b.w} height={HEADER_H} rx={10} fill={b.zone.color} opacity={0.18} />
                <rect x={0} y={HEADER_H - 10} width={b.w} height={10} fill={b.zone.color} opacity={0.18} />
                <circle cx={14} cy={HEADER_H / 2} r={5} fill={b.zone.color} />
                <text
                  x={26}
                  y={HEADER_H / 2 + 4}
                  fontSize={12}
                  fontWeight={600}
                  fill="#0e0e0e"
                >
                  {b.zone.name}
                </text>
                <text
                  x={b.w - PAD}
                  y={HEADER_H / 2 + 4}
                  fontSize={11}
                  textAnchor="end"
                  fill="#707075"
                >
                  {b.occ.length}/{b.zone.capacity}
                </text>

                {/* boutique cells */}
                {Array.from({ length: b.zone.capacity }, (_, idx) => {
                  const cellRow = Math.floor(idx / b.cellsPerRow);
                  const cellCol = idx % b.cellsPerRow;
                  const cx = PAD + cellCol * CELL;
                  const cy = HEADER_H + PAD + cellRow * CELL;

                  const shop = b.occ[idx];
                  const occupied = !!shop;
                  const isShopSelected = !!shop && shop.id === selectedShopId;
                  const isShopHovered = !!shop && shop.id === hoveredShopId;

                  return (
                    <g
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (shop) onShopClick(shop.id);
                      }}
                      onMouseEnter={() => shop && onShopHover(shop.id)}
                      onMouseLeave={() => onShopHover(null)}
                      style={{ cursor: shop ? 'pointer' : 'default' }}
                    >
                      <rect
                        x={cx + 2}
                        y={cy + 2}
                        width={CELL - 4}
                        height={CELL - 4}
                        rx={3}
                        fill={
                          occupied
                            ? isShopSelected
                              ? '#005bff'
                              : isShopHovered
                                ? '#3b82f6'
                                : b.zone.color
                            : '#ffffff'
                        }
                        fillOpacity={occupied ? (isShopSelected || isShopHovered ? 1 : 0.85) : 1}
                        stroke={occupied ? 'transparent' : '#d4d4d4'}
                        strokeDasharray={occupied ? undefined : '2 2'}
                      />
                      {shop?.is_verified && (
                        <circle cx={cx + CELL - 7} cy={cy + 7} r={3} fill="#ffffff" stroke="#0044cc" strokeWidth={1.2} />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label, outline }: { color: string; label: string; outline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-700">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{
          backgroundColor: outline ? '#ffffff' : color,
          border: outline ? `1px dashed ${color === '#e5e5e5' ? '#a3a3a3' : color}` : 'none',
        }}
      />
      {label}
    </span>
  );
}
