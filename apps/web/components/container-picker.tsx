'use client';

import { useState } from 'react';

export type ContainerPickerProps = {
  /** sectorId -> human label (pavilion · floor · sector) */
  sectors: { id: string; label: string; pavilionName: string }[];
  /** Occupied place_number per sector_id, so we can grey them out. */
  occupied: Record<string, string[]>;
  /** Rows × cells rendered per sector. */
  rows?: number;
  cellsPerRow?: number;
  initialSectorId?: string | null;
  initialPlaceNumber?: string | null;
};

/**
 * Visual picker that writes to the hidden `sector_id` and `place_number`
 * inputs already expected by the shop form's server action. The layout is
 * a simple free/occupied grid — not a literal bazaar footprint; it just
 * gives the seller something clickable instead of a blank text field.
 */
export function ContainerPicker({
  sectors,
  occupied,
  rows = 5,
  cellsPerRow = 10,
  initialSectorId,
  initialPlaceNumber,
}: ContainerPickerProps) {
  const [sectorId, setSectorId] = useState<string | null>(initialSectorId ?? sectors[0]?.id ?? null);
  const [placeNumber, setPlaceNumber] = useState<string | null>(initialPlaceNumber ?? null);

  const sector = sectors.find((s) => s.id === sectorId) ?? null;
  const taken = new Set(sectorId ? occupied[sectorId] ?? [] : []);

  const totalCells = rows * cellsPerRow;

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="sector_id" value={sectorId ?? ''} />
      <input type="hidden" name="place_number" value={placeNumber ?? ''} />

      <div className="flex flex-wrap gap-1 text-xs">
        {sectors.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => {
              setSectorId(s.id);
              setPlaceNumber(null);
            }}
            className={[
              'rounded-md border px-2 py-1 transition',
              sectorId === s.id ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!sector ? (
        <p className="text-sm text-neutral-500">Нет секторов — сначала засейте рынок.</p>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{sector.pavilionName}</span>
            <span>Свободных мест: {totalCells - taken.size}</span>
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cellsPerRow}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: totalCells }, (_, i) => {
              const num = String(i + 1).padStart(3, '0');
              const isTaken = taken.has(num);
              const isSelected = placeNumber === num;
              return (
                <button
                  type="button"
                  key={num}
                  onClick={() => !isTaken && setPlaceNumber(num)}
                  disabled={isTaken}
                  className={[
                    'aspect-square rounded-sm text-[10px] font-semibold transition',
                    isSelected
                      ? 'bg-brand text-brand-fg'
                      : isTaken
                        ? 'cursor-not-allowed bg-neutral-300 text-neutral-500'
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
                  ].join(' ')}
                  title={isTaken ? `${num} · занято` : `${num} · свободно`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
            <Legend color="bg-emerald-100 border-emerald-300" label="свободно" />
            <Legend color="bg-neutral-300 border-neutral-400" label="занято" />
            <Legend color="bg-brand border-brand" label="выбрано" />
            {placeNumber && (
              <span className="ml-auto font-semibold text-brand">Место №{placeNumber}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm border ${color}`} />
      {label}
    </span>
  );
}
