'use client';

import { useMemo, useState } from 'react';
import { formatKzt } from '@/lib/format';

export type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  price_kzt: number | null;
  stock_qty: number;
};

export function VariantPicker({
  variants,
  basePrice,
}: {
  variants: Variant[];
  basePrice: number;
}) {
  const sizes = useMemo(() => uniq(variants.map((v) => v.size).filter(Boolean) as string[]), [variants]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color).filter(Boolean) as string[]), [variants]);

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);

  const selected = useMemo(() => {
    return (
      variants.find(
        (v) => (size ? v.size === size : !v.size) && (color ? v.color === color : !v.color),
      ) ?? null
    );
  }, [variants, size, color]);

  const price = selected?.price_kzt ?? basePrice;
  const inStock = selected ? selected.stock_qty > 0 : true;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">{formatKzt(price)}</span>
        {selected && (
          <span
            className={[
              'rounded-md px-2 py-0.5 text-xs font-medium',
              inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600',
            ].join(' ')}
          >
            {inStock ? `в наличии ${selected.stock_qty} шт` : 'нет в наличии'}
          </span>
        )}
      </div>

      {sizes.length > 0 && (
        <PickerRow label="Размер" value={size} options={sizes} onChange={setSize} />
      )}
      {colors.length > 0 && (
        <PickerRow label="Цвет" value={color} options={colors} onChange={setColor} />
      )}

      {selected && <input type="hidden" name="variant_id" value={selected.id} />}
    </div>
  );
}

function PickerRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm transition',
              value === o
                ? 'border-brand bg-brand text-brand-fg'
                : 'border-neutral-300 text-neutral-800 hover:border-neutral-500',
            ].join(' ')}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
