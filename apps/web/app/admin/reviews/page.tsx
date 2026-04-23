import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { RatingStars } from '@/components/rating-stars';
import { deleteReviewAdmin } from '../actions';

type Row = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  shop: { id: string; name: string } | null;
  buyer_id: string;
};

export default async function AdminReviews() {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('review')
    .select('id, rating, text, created_at, buyer_id, shop:shop(id, name)')
    .order('created_at', { ascending: false })
    .limit(200);

  const reviews = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Отзывы</h1>
        <p className="mt-1 text-sm text-neutral-600">{reviews.length} записей (макс. 200)</p>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Пока нет отзывов.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => {
            const del = deleteReviewAdmin.bind(null, r.id);
            return (
              <li key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <RatingStars value={r.rating} size={12} />
                      <span>{new Date(r.created_at).toLocaleString('ru-RU')}</span>
                      {r.shop && (
                        <>
                          <span>·</span>
                          <Link href={`/shop/${r.shop.id}`} target="_blank" className="font-medium text-neutral-700 hover:text-brand">
                            {r.shop.name}
                          </Link>
                        </>
                      )}
                    </div>
                    {r.text && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{r.text}</p>}
                    <div className="mt-1 truncate text-[10px] text-neutral-400">buyer: {r.buyer_id.slice(0, 8)}…</div>
                  </div>
                  <form action={del}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-red-500 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
