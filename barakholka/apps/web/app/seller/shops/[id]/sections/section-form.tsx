export type SectionFormValues = {
  name?: string;
  slug?: string;
  order_idx?: number;
  is_visible?: boolean;
};

export function SectionForm({
  values,
  submitLabel,
  action,
}: {
  values?: SectionFormValues;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <Field label="Название" required>
        <input
          name="name"
          required
          defaultValue={values?.name ?? ''}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </Field>

      <Field label="Slug (из URL; оставь пустым — сгенерируется)">
        <input
          name="slug"
          defaultValue={values?.slug ?? ''}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 font-mono text-xs outline-none focus:border-brand"
        />
      </Field>

      <Field label="Порядок">
        <input
          name="order_idx"
          type="number"
          min="0"
          defaultValue={values?.order_idx ?? 0}
          className="w-24 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={values?.is_visible ?? true}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <span>Показывать в бутике</span>
      </label>

      <div>
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
