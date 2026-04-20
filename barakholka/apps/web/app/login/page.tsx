import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export const metadata = { title: 'Вход — Барахолка.kz' };

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;

  async function signIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const nextHref = String(formData.get('next') ?? '/seller');
    if (!email || !password) redirect(`/login?next=${encodeURIComponent(nextHref)}&error=required`);

    const supabase = await getSupabaseServer();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      redirect(`/login?next=${encodeURIComponent(nextHref)}&error=${encodeURIComponent(authErr.message)}`);
    }
    redirect(nextHref);
  }

  return (
    <div className="mx-auto max-w-md pt-10">
      <h1 className="text-2xl font-semibold">Вход продавца</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Нет аккаунта?{' '}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Регистрация
        </Link>
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error === 'required' ? 'Заполните email и пароль.' : error}
        </div>
      )}

      <form action={signIn} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? '/seller'} />
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
          <span className="font-medium">Пароль</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
