-- Wave 3: admin role + admin-scope RLS on moderated tables.
--
-- The `seller` table doubles as "any user who might sell" (we auto-insert a
-- row on first /seller visit). Adding `is_admin` here keeps the auth story
-- simple: one sign-in, one role flag.
--
-- Admin policies are additive to existing owner/public ones. They apply to
-- UPDATE/DELETE/INSERT via the seller.is_admin check; SELECT is already
-- public for active rows.

alter table seller add column if not exists is_admin boolean not null default false;

create index if not exists seller_is_admin_idx on seller(id) where is_admin = true;

-- Admin full access on shop (moderate any shop's is_active/is_verified)
create policy shop_admin_rw on shop for all
  using (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin))
  with check (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin));

-- Admin full access on product (hide/flag)
create policy product_admin_rw on product for all
  using (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin))
  with check (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin));

-- Admin can delete / edit any review
create policy review_admin_rw on review for all
  using (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin))
  with check (exists (select 1 from seller s where s.id = auth.uid() and s.is_admin));
