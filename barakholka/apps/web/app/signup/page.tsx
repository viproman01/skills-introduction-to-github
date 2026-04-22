import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export const metadata = { title: 'Регистрация — Барахолка.kz' };

type SearchParams = Promise<{ error?: string; role?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, role: prefill } = await searchParams;
  const defaultRole = prefill === 'seller' ? 'seller' : 'buyer';

  async function signUp(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const fullName = String(formData.get('full_name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const role = formData.get('role') === 'seller' ? 'seller' : 'buyer';

    if (!email || !password || !fullName) {
      redirect(`/signup?role=${role}&error=required`);
    }

    const supabase = await getSupabaseServer();
    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) redirect(`/signup?role=${role}&error=${encodeURIComponent(authErr.message)}`);

    if (data.user && data.session) {
      if (role === 'seller') {
        // Promote to seller: create the seller row now so RLS lets them open a shop.
        await supabase.from('seller').upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone || null,
        });
        redirect('/seller');
      }
      // Buyer: just keep the auth.users row. seller row gets created lazily
      // by requireSeller() only if they later visit /seller.
      redirect('/?welcome=1');
    }

    redirect('/login?error=' + encodeURIComponent('Проверьте email для подтверждения аккаунта.'));
  }

  return (
    <div className="mx-auto max-w-md pt-10">
      <h1 className="text-2xl font-semibold">Регистрация</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Войти
        </Link>
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'required' ? 'Заполните имя, email и пароль.' : error}
        </div>
      )}

      <form action={signUp} className="mt-5 flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Зачем регистрируетесь?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="role" value="buyer" defaultChecked={defaultRole === 'buyer'} className="mt-1" />
            <div>
              <div className="text-sm font-semibold">Покупать 🛍️</div>
              <div className="text-xs text-neutral-600">Искать товары, писать продавцам, ставить отзывы, сохранять избранное.</div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="role" value="seller" defaultChecked={defaultRole === 'seller'} className="mt-1" />
            <div>
              <div className="text-sm font-semibold">Продавать 🏬</div>
              <div className="text-xs text-neutral-600">Открыть бутик на Барахолке, добавлять товары с фото, получать заявки.</div>
            </div>
          </label>
        </fieldset>

        <label className="mt-2 flex flex-col gap-1 text-sm">
          <span className="font-medium">Имя и фамилия</span>
          <input
            name="full_name"
            required
            autoComplete="name"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Телефон (необязательно)</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+7 7__ ___ __ __"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Пароль</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          Создать аккаунт
        </button>
      </form>
    </div>
  );
}
