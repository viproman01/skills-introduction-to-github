import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export type SellerSession = {
  userId: string;
  email: string | null;
  fullName: string;
};

/**
 * Guards a server component or server action: ensures the current user is signed
 * in and has a matching `seller` row. Creates the seller row on first visit if
 * missing (matches RLS policy: auth.uid() = seller.id). Redirects to /login
 * otherwise, preserving `next` so we bounce back after auth.
 */
export async function requireSeller(nextPath = '/seller'): Promise<SellerSession> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: existing } = await supabase
    .from('seller')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!existing) {
    const fallback = user.email?.split('@')[0] ?? 'Продавец';
    await supabase.from('seller').insert({
      id: user.id,
      full_name: fallback,
    });
    return { userId: user.id, email: user.email ?? null, fullName: fallback };
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: (existing as { full_name?: string }).full_name ?? 'Продавец',
  };
}

/**
 * Returns the auth.users row for the current request, or null.
 * Use for surfaces that need "signed in or not" (reviews, favorites) without
 * the seller-row implication of requireSeller() / getSellerSession().
 */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/** True if the signed-in user has seller.is_admin = true. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('seller')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    return Boolean((data as { is_admin?: boolean } | null)?.is_admin);
  } catch {
    return false;
  }
}

/** Gate an /admin/* page: redirects unsigned users to /login, signed non-admins to /. */
export async function requireAdmin(nextPath = '/admin'): Promise<{ userId: string; email: string | null }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const admin = await isAdmin();
  if (!admin) redirect('/');
  return { userId: user.id, email: user.email };
}

/** Like requireSeller but returns null instead of redirecting — for optional-auth pages. */
export async function getSellerSession(): Promise<SellerSession | null> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: s } = await supabase
    .from('seller')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();
  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: (s as { full_name?: string } | null)?.full_name ?? user.email?.split('@')[0] ?? 'Продавец',
  };
}
