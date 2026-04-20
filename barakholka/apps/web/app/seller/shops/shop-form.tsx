import { getSupabaseServer } from '@/lib/supabase/server';

type SectorRow = {
  id: string;
  code: string;
  floor: number;
  zone: { name: string; slug: string } | null;
};

export type ShopFormValues = {
  name?: string;
  description?: string | null;
  sector_id?: string | null;
  row_number?: string | null;
  place_number?: string | null;
  photos?: string[];
  is_active?: boolean;
};

export async function ShopForm({
  values,
  submitLabel,
  action,
}: {
  values?: ShopFormValues;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('sector')
    .select('id, code, floor, zone:zone(name, slug)')
    .order('code')
    .limit(300);
  const sectors = (data ?? []) as unknown as SectorRow[];

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <Field label="Название бутика" required>
        <input
          name="name"
          required
          defaultValue={values?.name ?? ''}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </Field>

      <Field label="Описание">
        <textarea
          name="description"
          rows={3}
          defaultValue={values?.description ?? ''}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </Field>

      <Field label="Ряд и место в базаре">
        <div className="grid grid-cols-3 gap-3">
          <select
            name="sector_id"
            defaultValue={values?.sector_id ?? ''}
            className="col-span-3 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand md:col-span-1"
          >
            <option value="">— ряд не выбран —</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.zone?.name ?? '?'} · сектор {s.code}
                {s.floor > 1 ? ` · ${s.floor} эт.` : ''}
              </option>
            ))}
          </select>
          <input
            name="row_number"
            placeholder="№ ряда"
            defaultValue={values?.row_number ?? ''}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <input
            name="place_number"
            placeholder="№ контейнера / места"
            defaultValue={values?.place_number ?? ''}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </Field>

      <Field label="Фото (URL, по одному на строке)">
        <textarea
          name="photos"
          rows={3}
          defaultValue={(values?.photos ?? []).join('\n')}
          placeholder="https://…/photo1.jpg&#10;https://…/photo2.jpg"
          className="rounded-lg border border-neutral-300 px-3 py-2.5 font-mono text-xs outline-none focus:border-brand"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={values?.is_active ?? true}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <span>Активен — показывать покупателям</span>
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}
