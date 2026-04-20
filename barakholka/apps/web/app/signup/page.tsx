import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export const metadata = { title: 'Регистрация — Барахолка.kz' };

type SearchParams = Promise<{ error?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  async function signUp(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const fullName = String(formData.get('full_name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    if (!email || !password || !fullName) {
      redirect('/signup?error=required');
    }

    const supabase = await getSupabaseServer();
    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) redirect(`/signup?error=${encodeURIComponent(authErr.message)}`);

    // User may need email confirmation. If session is already set, insert the
    // seller row; otherwise the next login will create it via requireSeller().
    if (data.user && data.session) {
      await supabase.from('seller').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: phone || null,
      });
      redirect('/seller');
    }

    redirect('/login?error=' + encodeURIComponent('Проверьте email для подтверждения аккаунта.'));
  }

  return (
    <div className="mx-auto max-w-md pt-10">
      <h1 className="text-2xl font-semibold">Регистрация продавца</h1>
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
        <label className="flex flex-col gap-1 text-sm">
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
