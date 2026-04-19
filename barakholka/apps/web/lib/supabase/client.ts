'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@barakholka/db';

export function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
