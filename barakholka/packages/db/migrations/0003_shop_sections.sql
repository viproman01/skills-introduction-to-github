-- Stage 4: Shop-level catalog sections (seller-managed "collections").
--
-- A seller can organize their products into custom sections within a shop,
-- e.g., "Зимняя коллекция", "Новинки", "Скидки". Products get an optional
-- FK to a section; the section itself is scoped to one shop.

create table shop_section (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shop(id) on delete cascade,
  name        text not null,
  slug        text not null,
  order_idx   int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (shop_id, slug)
);

create index shop_section_shop_idx on shop_section(shop_id, order_idx);

alter table product
  add column section_id uuid references shop_section(id) on delete set null;

create index product_section_idx on product(section_id);

alter table shop_section enable row level security;

create policy shop_section_public_read on shop_section
  for select using (is_visible);

create policy shop_section_owner_rw on shop_section for all
  using (exists (
    select 1 from shop where shop.id = shop_section.shop_id and shop.seller_id = auth.uid()
  ))
  with check (exists (
    select 1 from shop where shop.id = shop_section.shop_id and shop.seller_id = auth.uid()
  ));
