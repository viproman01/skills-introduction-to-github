import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieInput = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: CookieInput[]) => {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session if expired. Swallow errors: missing env should not 500 on every request.
  try {
    await supabase.auth.getUser();
  } catch {
    /* noop */
  }

  return response;
}
