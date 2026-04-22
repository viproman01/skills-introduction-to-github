import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { SectionForm } from '../section-form';
import { deleteSection, updateSection } from '../actions';

type Params = Promise<{ id: string; sectionId: string }>;
type SearchParams = Promise<{ error?: string; saved?: string }>;

type Section = {
  id: string;
  name: string;
  slug: string;
  order_idx: number;
  is_visible: boolean;
};

export default async function EditSectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id: shopId, sectionId } = await params;
  const { error, saved } = await searchParams;
  const seller = await requireSeller(`/seller/shops/${shopId}/sections/${sectionId}`);
  const supabase = await getSupabaseServer();

  // Verify shop belongs to seller
  const { data: shop } = await supabase
    .from('shop')
    .select('id')
    .eq('id', shopId)
    .eq('seller_id', seller.userId)
    .maybeSingle();
  if (!shop) notFound();

  const { data } = await supabase
    .from('shop_section')
    .select('id, name, slug, order_idx, is_visible')
    .eq('id', sectionId)
    .eq('shop_id', shopId)
    .maybeSingle();
  const section = data as Section | null;
  if (!section) notFound();

  const boundUpdate = updateSection.bind(null, shopId, sectionId);
  const boundDelete = deleteSection.bind(null, shopId, sectionId);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href={`/seller/shops/${shopId}/sections`} className="text-sm text-neutral-500 hover:text-brand">
          ← к разделам
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{section.name}</h1>
      </header>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Сохранено.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'name' ? 'Название обязательно.' : error}
        </div>
      )}

      <SectionForm
        action={boundUpdate}
        submitLabel="Сохранить"
        values={{
          name: section.name,
          slug: section.slug,
          order_idx: section.order_idx,
          is_visible: section.is_visible,
        }}
      />

      <form action={boundDelete} className="border-t border-neutral-200 pt-4">
        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
          Удалить раздел
        </button>
      </form>
    </div>
  );
}
