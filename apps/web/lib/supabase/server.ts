import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieInput = { name: string; value: string; options?: CookieOptions };

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: CookieInput[]) => {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
