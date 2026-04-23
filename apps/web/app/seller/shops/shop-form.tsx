import { getSupabaseServer } from '@/lib/supabase/server';
import { PhotoUploader } from '@/components/photo-uploader';
import { ContainerPicker } from '@/components/container-picker';

type SectorRow = {
  id: string;
  code: string;
  floor: number;
  zone: { name: string; slug: string } | null;
};

type ShopOccupied = {
  sector_id: string;
  place_number: string | null;
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
  const [{ data: sectorData }, { data: occupiedData }] = await Promise.all([
    supabase
      .from('sector')
      .select('id, code, floor, zone:zone(name, slug)')
      .order('code')
      .limit(300),
    supabase
      .from('shop')
      .select('sector_id, place_number')
      .eq('is_active', true)
      .not('sector_id', 'is', null)
      .limit(5000),
  ]);

  const sectors = (sectorData ?? []) as unknown as SectorRow[];
  const occupiedRows = (occupiedData ?? []) as ShopOccupied[];

  const occupied: Record<string, string[]> = {};
  for (const row of occupiedRows) {
    if (!row.sector_id) continue;
    if (!occupied[row.sector_id]) occupied[row.sector_id] = [];
    if (row.place_number) occupied[row.sector_id]!.push(row.place_number);
  }

  const pickerSectors = sectors.map((s) => ({
    id: s.id,
    pavilionName: s.zone?.name ?? '?',
    label: `${s.zone?.name ?? '?'} · ${s.code}${s.floor > 1 ? ` · ${s.floor} эт.` : ''}`,
  }));

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
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

      <Field label="Ряд и место — выберите пустую клетку">
        <ContainerPicker
          sectors={pickerSectors}
          occupied={occupied}
          initialSectorId={values?.sector_id ?? undefined}
          initialPlaceNumber={values?.place_number ?? undefined}
        />
      </Field>

      <Field label="Номер ряда (если известен)">
        <input
          name="row_number"
          placeholder="например 14"
          defaultValue={values?.row_number ?? ''}
          className="w-32 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </Field>

      <Field label="Фото бутика">
        <PhotoUploader bucket="shop-photos" name="photos" initialUrls={values?.photos ?? []} max={6} />
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
