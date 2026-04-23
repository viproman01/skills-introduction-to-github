import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { PhotoUploader } from '@/components/photo-uploader';

export type ProductFormValues = {
  shop_id?: string;
  category_id?: string | null;
  section_id?: string | null;
  title?: string;
  description?: string | null;
  price_kzt?: number;
  condition?: 'new' | 'used';
  is_wholesale?: boolean;
  min_wholesale_qty?: number | null;
  is_available?: boolean;
  photos?: string[];
};

type ShopOption = { id: string; name: string };
type CategoryOption = { id: string; name_ru: string; slug: string };
type SectionOption = { id: string; name: string; shop_id: string };

export async function ProductForm({
  values,
  submitLabel,
  action,
  lockShop,
}: {
  values?: ProductFormValues;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  lockShop?: boolean;
}) {
  const seller = await requireSeller();
  const supabase = await getSupabaseServer();

  const [shopsRes, catsRes, sectionsRes] = await Promise.all([
    supabase.from('shop').select('id, name').eq('seller_id', seller.userId).order('created_at', { ascending: false }),
    supabase.from('category').select('id, name_ru, slug').order('name_ru'),
    supabase
      .from('shop_section')
      .select('id, name, shop_id, shop:shop!inner(seller_id)')
      .eq('shop.seller_id', seller.userId)
      .order('order_idx'),
  ]);
  const shops = (shopsRes.data ?? []) as ShopOption[];
  const cats = (catsRes.data ?? []) as CategoryOption[];
  const sections = (sectionsRes.data ?? []) as unknown as SectionOption[];
  const sectionsForCurrentShop = values?.shop_id
    ? sections.filter((s) => s.shop_id === values.shop_id)
    : sections;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <Field label="Бутик" required>
        <select
          name="shop_id"
          required
          defaultValue={values?.shop_id ?? ''}
          disabled={lockShop}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-neutral-100"
        >
          <option value="">— выберите бутик —</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {shops.length === 0 && (
          <span className="text-xs text-red-600">
            Сначала создайте бутик в разделе «Мои бутики».
          </span>
        )}
      </Field>

      <Field label="Название товара" required>
        <input
          name="title"
          required
          defaultValue={values?.title ?? ''}
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Цена, ₸" required>
          <input
            name="price_kzt"
            type="number"
            min="0"
            required
            defaultValue={values?.price_kzt ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </Field>
        <Field label="Состояние">
          <select
            name="condition"
            defaultValue={values?.condition ?? 'new'}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="new">Новый</option>
            <option value="used">Б/у</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Категория">
          <select
            name="category_id"
            defaultValue={values?.category_id ?? ''}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="">— без категории —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ru}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Раздел бутика">
          <select
            name="section_id"
            defaultValue={values?.section_id ?? ''}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="">— без раздела —</option>
            {sectionsForCurrentShop.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_wholesale"
            defaultChecked={values?.is_wholesale ?? false}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <span>Доступен оптом</span>
        </label>
        <Field label="Мин. опт (шт)">
          <input
            name="min_wholesale_qty"
            type="number"
            min="1"
            defaultValue={values?.min_wholesale_qty ?? ''}
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </Field>
      </div>

      <Field label="Фото товара">
        <PhotoUploader bucket="product-photos" name="photos" initialUrls={values?.photos ?? []} max={8} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={values?.is_available ?? true}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <span>В наличии — показывать покупателям</span>
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={shops.length === 0}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
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
