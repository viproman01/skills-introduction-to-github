'use client';

import { useState } from 'react';

export type VariantInput = {
  id?: string;
  size?: string | null;
  color?: string | null;
  price_kzt?: number | null;
  stock_qty?: number;
};

type Row = { size: string; color: string; price: string; stock: string };

export function VariantsEditor({
  productId,
  initial,
  action,
}: {
  productId: string;
  initial: VariantInput[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.length > 0
      ? initial.map((v) => ({
          size: v.size ?? '',
          color: v.color ?? '',
          price: v.price_kzt ? String(v.price_kzt) : '',
          stock: v.stock_qty != null ? String(v.stock_qty) : '',
        }))
      : [blankRow()],
  );

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const addRow = () => setRows((prev) => [...prev, blankRow()]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="product_id" value={productId} />

      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2 text-xs font-medium text-neutral-600">
        <div>Размер</div>
        <div>Цвет</div>
        <div className="w-24 text-right">Цена, ₸</div>
        <div className="w-20 text-right">Остаток</div>
        <div className="w-8" />
      </div>

      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2">
          <input
            name="size"
            value={r.size}
            onChange={(e) => setRow(i, { size: e.target.value })}
            placeholder="S / M / 42"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            name="color"
            value={r.color}
            onChange={(e) => setRow(i, { color: e.target.value })}
            placeholder="Чёрный"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            name="price_kzt"
            type="number"
            min="0"
            value={r.price}
            onChange={(e) => setRow(i, { price: e.target.value })}
            placeholder="0"
            className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm outline-none focus:border-brand"
          />
          <input
            name="stock_qty"
            type="number"
            min="0"
            value={r.stock}
            onChange={(e) => setRow(i, { stock: e.target.value })}
            placeholder="0"
            className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Удалить"
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-brand hover:text-brand"
        >
          + Добавить вариант
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-brand-fg hover:bg-brand-hover"
        >
          Сохранить варианты
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Оставьте поле пустым, если вариант без этого параметра. Если цена не указана — берётся цена товара.
      </p>
    </form>
  );
}

function blankRow(): Row {
  return { size: '', color: '', price: '', stock: '' };
}
