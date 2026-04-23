import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { updateLeadStatus } from './actions';

type Status = 'new' | 'contacted' | 'done' | 'cancelled';
const STATUS_LABEL: Record<Status, string> = {
  new: 'Новая',
  contacted: 'В ответе',
  done: 'Завершена',
  cancelled: 'Отменена',
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '🟢',
  telegram: '✈️',
  phone: '📞',
  kaspi: '🅺',
};

type Row = {
  id: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  message: string | null;
  channel: string;
  status: Status;
  created_at: string;
  product: {
    id: string;
    title: string;
    price_kzt: number;
    shop: { id: string; name: string; seller_id: string } | null;
  } | null;
};

type SearchParams = Promise<{ status?: Status }>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status: statusFilter } = await searchParams;
  const seller = await requireSeller('/seller/leads');
  const supabase = await getSupabaseServer();

  let q = supabase
    .from('order_lead')
    .select(
      'id, buyer_name, buyer_phone, message, channel, status, created_at,' +
        ' product:product!inner(id, title, price_kzt, shop:shop!inner(id, name, seller_id))',
    )
    .eq('product.shop.seller_id', seller.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter && Object.keys(STATUS_LABEL).includes(statusFilter)) {
    q = q.eq('status', statusFilter);
  }

  const { data } = await q;
  const leads = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Заявки</h1>
        <p className="mt-1 text-sm text-neutral-600">Покупатели пишут — отвечайте быстро, это влияет на рейтинг.</p>
      </header>

      <nav className="flex flex-wrap gap-2 text-sm">
        <FilterLink href="/seller/leads" active={!statusFilter}>Все</FilterLink>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <FilterLink key={s} href={`/seller/leads?status=${s}`} active={statusFilter === s}>
            {STATUS_LABEL[s]}
          </FilterLink>
        ))}
      </nav>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          {statusFilter ? 'Нет заявок с таким статусом.' : 'Пока нет заявок.'}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {leads.map((lead) => {
            const boundUpdate = updateLeadStatus.bind(null, lead.id);
            return (
              <li
                key={lead.id}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span>{CHANNEL_ICON[lead.channel] ?? '•'} {lead.channel}</span>
                      <span>·</span>
                      <span>{new Date(lead.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="mt-1 font-medium text-neutral-900">
                      {lead.buyer_name || 'Без имени'}
                      {lead.buyer_phone && (
                        <a href={`tel:${lead.buyer_phone}`} className="ml-2 text-sm text-brand hover:underline">
                          {lead.buyer_phone}
                        </a>
                      )}
                    </div>
                    {lead.message && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{lead.message}</p>
                    )}
                    {lead.product && (
                      <Link
                        href={`/seller/products/${lead.product.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-brand"
                      >
                        🏷️ {lead.product.title} · {lead.product.shop?.name ?? 'без бутика'}
                      </Link>
                    )}
                  </div>

                  <form action={boundUpdate} className="flex shrink-0 items-center gap-2">
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-brand"
                    >
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
                    >
                      OK
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

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        'rounded-full border px-3 py-1 text-xs transition',
        active ? 'border-brand bg-brand text-brand-fg' : 'border-neutral-300 text-neutral-700 hover:border-neutral-500',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
