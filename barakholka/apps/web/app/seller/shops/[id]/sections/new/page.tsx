import Link from 'next/link';
import { SectionForm } from '../section-form';
import { createSection } from '../actions';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function NewSectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id: shopId } = await params;
  const { error } = await searchParams;
  const bound = createSection.bind(null, shopId);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href={`/seller/shops/${shopId}/sections`} className="text-sm text-neutral-500 hover:text-brand">
          ← к разделам
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Новый раздел</h1>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'name' ? 'Название обязательно.' : error}
        </div>
      )}

      <SectionForm action={bound} submitLabel="Создать" />
    </div>
  );
}
