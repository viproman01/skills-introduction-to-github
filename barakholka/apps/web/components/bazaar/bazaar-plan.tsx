'use client';

import { useMemo, useState } from 'react';
import { ROW_CAPACITY, ROW_DEFS, type Container } from './types';

export type BazaarPlanProps = {
  containers: Container[];
  selectedRow: string | null;
  selectedContainerId: string | null;
  hoveredContainerId: string | null;
  onRowClick: (slug: string | null) => void;
  onContainerClick: (id: string) => void;
  onContainerHover: (id: string | null) => void;
};

const CELL_W = 32;
const CELL_H = 48;
const LABEL_W = 56;
const ROW_GAP = 16;
const PAD_X = 16;
const PAD_Y = 24;

/** Rows layout. Row 'А' row is at the top and has ВЫ ЗДЕСЬ marker. */
const SPECIAL_CELLS: Record<string, { at: number; kind: 'here' | 'store' | 'gate'; label: string }[]> = {
  adem: [{ at: 6, kind: 'here', label: 'ВЫ ЗДЕСЬ · ВХОД №2' }],
  almaly: [{ at: 14, kind: 'store', label: 'СКЛАД' }],
  bereket: [{ at: 28, kind: 'gate', label: 'ВОРОТА 3' }],
};

export function BazaarPlan({
  containers,
  selectedRow,
  selectedContainerId,
  hoveredContainerId,
  onRowClick,
  onContainerClick,
  onContainerHover,
}: BazaarPlanProps) {
  const [zoom, setZoom] = useState(1);

  // Assign each container to a slot within its row, deterministically by index.
  const rows = useMemo(() => {
    const grouped = new Map<string, Container[]>();
    for (const def of ROW_DEFS) grouped.set(def.slug, []);
    for (const c of containers) {
      if (grouped.has(c.rowSlug)) grouped.get(c.rowSlug)!.push(c);
    }
    for (const arr of grouped.values()) arr.sort((a, b) => a.id.localeCompare(b.id));
    return ROW_DEFS.map((def) => ({
      def,
      capacity: ROW_CAPACITY[def.slug] ?? 24,
      items: grouped.get(def.slug) ?? [],
    }));
  }, [containers]);

  const maxCapacity = Math.max(...rows.map((r) => r.capacity));
  const width = LABEL_W + maxCapacity * CELL_W + PAD_X * 2;
  const height = PAD_Y * 2 + rows.length * (CELL_H + ROW_GAP) - ROW_GAP;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-bazaar-line bg-[#FCF6E4]">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-bazaar-line bg-white text-lg text-bazaar-ink hover:bg-bazaar-card"
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-bazaar-line bg-white text-lg text-bazaar-ink hover:bg-bazaar-card"
          aria-label="Zoom out"
        >−</button>
      </div>

      <div className="flex-1 overflow-auto">
        <div
          style={{
            width: width * zoom,
            height: height * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            shapeRendering="crispEdges"
            className="block"
          >
            {rows.map((row, rowIdx) => {
              const y = PAD_Y + rowIdx * (CELL_H + ROW_GAP);
              const isRowSelected = selectedRow === row.def.slug;
              const rowDim = !!selectedRow && !isRowSelected;

              const specials = SPECIAL_CELLS[row.def.slug] ?? [];
              const specialSet = new Set(specials.map((s) => s.at));

              return (
                <g key={row.def.slug} opacity={rowDim ? 0.4 : 1}>
                  {/* Row label badge (vertical letter) */}
                  <g
                    style={{ cursor: 'pointer' }}
                    onClick={() => onRowClick(isRowSelected ? null : row.def.slug)}
                  >
                    <rect
                      x={PAD_X}
                      y={y}
                      width={LABEL_W - 8}
                      height={CELL_H}
                      rx={6}
                      fill={isRowSelected ? '#E87B3A' : '#2B2623'}
                    />
                    <text
                      x={PAD_X + (LABEL_W - 8) / 2}
                      y={y + 20}
                      textAnchor="middle"
                      fontSize={14}
                      fontWeight={700}
                      fill="#F4EBD1"
                    >
                      {row.def.letter}
                    </text>
                    <text
                      x={PAD_X + (LABEL_W - 8) / 2}
                      y={y + 36}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight={600}
                      letterSpacing="0.05em"
                      fill="#F4EBD1"
                      opacity={0.75}
                    >
                      {row.def.name.toUpperCase().split(' · ')[0]!.slice(0, 7)}
                    </text>
                  </g>

                  {/* Cells */}
                  {Array.from({ length: row.capacity }, (_, i) => {
                    const x = PAD_X + LABEL_W + i * CELL_W;
                    const special = specials.find((s) => s.at === i);

                    if (special) {
                      return (
                        <g key={`s${i}`}>
                          <rect
                            x={x + 1}
                            y={y}
                            width={CELL_W * (special.label.length > 10 ? 6 : 3) - 2}
                            height={CELL_H}
                            rx={6}
                            fill={special.kind === 'here' ? '#E87B3A' : '#1E1B19'}
                          />
                          <text
                            x={x + (CELL_W * (special.label.length > 10 ? 6 : 3)) / 2}
                            y={y + CELL_H / 2 + 4}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={700}
                            letterSpacing="0.08em"
                            fill="#F4EBD1"
                          >
                            {special.label}
                          </text>
                        </g>
                      );
                    }

                    // Skip cells overlapped by a preceding multi-width special
                    for (const s of specials) {
                      const span = s.label.length > 10 ? 6 : 3;
                      if (i > s.at && i < s.at + span) return null;
                    }
                    if (specialSet.has(i)) return null;

                    const c = row.items[i];
                    const isSelected = !!c && c.id === selectedContainerId;
                    const isHovered = !!c && c.id === hoveredContainerId;

                    const fill = !c
                      ? '#F3EAD0'
                      : c.isLive
                        ? '#6EA874'
                        : c.isHit
                          ? '#E87B3A'
                          : c.openNow
                            ? '#BFD8B2'
                            : '#E3EEDB';
                    const stroke = !c ? '#D4C9AE' : isSelected ? '#1E1B19' : isHovered ? '#2B2623' : '#ffffff';
                    const strokeWidth = !c ? 1 : isSelected ? 2.5 : 1.5;

                    return (
                      <g
                        key={i}
                        style={{ cursor: c ? 'pointer' : 'default' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (c) onContainerClick(c.id);
                        }}
                        onMouseEnter={() => c && onContainerHover(c.id)}
                        onMouseLeave={() => onContainerHover(null)}
                      >
                        <rect
                          x={x + 2}
                          y={y + 2}
                          width={CELL_W - 4}
                          height={CELL_H - 4}
                          rx={4}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          strokeDasharray={c ? undefined : '3 2'}
                        />
                        {c?.isLive && (
                          <circle
                            cx={x + CELL_W - 7}
                            cy={y + 7}
                            r={3}
                            fill="#FFFFFF"
                          >
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
                          </circle>
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

      <div className="flex flex-wrap items-center gap-3 border-t border-bazaar-line bg-bazaar-card/60 px-4 py-3 text-xs text-bazaar-ink">
        <LegendSwatch bg="#BFD8B2" label="открыт" />
        <LegendSwatch bg="#E87B3A" label="акция" />
        <LegendSwatch bg="#6EA874" label="live" />
        <LegendSwatch bg="#F3EAD0" label="свободен" outline />
        <button className="ml-auto flex items-center gap-1.5 rounded-md border border-bazaar-line bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-bazaar-ink hover:bg-bazaar-card">
          <span>📦</span> Камера хранения
        </button>
      </div>
    </div>
  );
}

function LegendSwatch({ bg, label, outline }: { bg: string; label: string; outline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{
          backgroundColor: bg,
          border: outline ? '1px dashed #D4C9AE' : 'none',
        }}
      />
      {label}
    </span>
  );
}
