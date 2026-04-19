-- Barakholka initial schema
-- Safe to re-run? No — this is a first migration. For a fresh DB only.

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ============================================================================
-- Reference: markets, zones (corps), sectors
-- ============================================================================

create table market (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  center_geo geography(point, 4326) not null,
  created_at timestamptz not null default now()
);

create table zone (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references market(id) on delete cascade,
  name text not null,
  slug text not null,
  geojson_polygon jsonb not null,
  floor_count int not null default 1,
  created_at timestamptz not null default now(),
  unique (market_id, slug)
);

create table sector (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zone(id) on delete cascade,
  code text not null,
  floor int not null default 1,
  geojson_polygon jsonb,
  created_at timestamptz not null default now(),
  unique (zone_id, code, floor)
);

-- ============================================================================
-- Sellers & shops
-- ============================================================================

create table seller (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  full_name text,
  telegram_id bigint,
  telegram_username text,
  kaspi_merchant_id text,
  is_verified boolean not null default false,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now()
);

create table shop (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller(id) on delete cascade,
  sector_id uuid references sector(id) on delete set null,
  name text not null,
  description text,
  row_number text,
  place_number text,
  coords geography(point, 4326),
  polygon geography(polygon, 4326),
  photos text[] not null default '{}',
  hours jsonb,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shop_sector_idx on shop(sector_id);
create index shop_seller_idx on shop(seller_id);
create index shop_coords_gix on shop using gist(coords);

-- ============================================================================
-- Catalog
-- ============================================================================

create table category (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references category(id) on delete set null,
  name_ru text not null,
  name_kz text,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create type product_condition as enum ('new', 'used');

create table product (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shop(id) on delete cascade,
  category_id uuid references category(id) on delete set null,
  title text not null,
  description text,
  price_kzt int not null check (price_kzt >= 0),
  condition product_condition not null default 'new',
  is_wholesale boolean not null default false,
  min_wholesale_qty int,
  is_available boolean not null default true,
  views_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_shop_idx on product(shop_id);
create index product_category_idx on product(category_id);
create index product_fts_idx on product
  using gin (to_tsvector('russian', coalesce(title,'') || ' ' || coalesce(description,'')));
create index product_trgm_idx on product using gin (title gin_trgm_ops);

create type media_type as enum ('photo', 'video');

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  type media_type not null,
  url text not null,
  order_idx int not null default 0,
  created_at timestamptz not null default now()
);

create index product_media_product_idx on product_media(product_id, order_idx);

create table product_variant (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  size text,
  color text,
  price_kzt int,
  stock_qty int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Interactions
-- ============================================================================

create type lead_channel as enum ('whatsapp', 'telegram', 'phone', 'kaspi');
create type lead_status as enum ('new', 'contacted', 'done', 'cancelled');

create table order_lead (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  buyer_phone text,
  buyer_name text,
  message text,
  channel lead_channel not null,
  status lead_status not null default 'new',
  created_at timestamptz not null default now()
);

create index order_lead_product_idx on order_lead(product_id);
create index order_lead_status_idx on order_lead(status);

create table review (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shop(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now(),
  unique (shop_id, buyer_id)
);

create table favorite (
  buyer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references product(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

-- ============================================================================
-- Row-Level Security
-- ============================================================================

alter table market        enable row level security;
alter table zone          enable row level security;
alter table sector        enable row level security;
alter table seller        enable row level security;
alter table shop          enable row level security;
alter table category      enable row level security;
alter table product       enable row level security;
alter table product_media enable row level security;
alter table product_variant enable row level security;
alter table order_lead    enable row level security;
alter table review        enable row level security;
alter table favorite      enable row level security;

-- Public read for catalog surfaces
create policy market_public_read   on market       for select using (true);
create policy zone_public_read     on zone         for select using (true);
create policy sector_public_read   on sector       for select using (true);
create policy category_public_read on category     for select using (true);
create policy shop_public_read     on shop         for select using (is_active);
create policy product_public_read  on product      for select using (is_available);
create policy media_public_read    on product_media
  for select using (exists (select 1 from product p where p.id = product_id and p.is_available));
create policy variant_public_read  on product_variant
  for select using (exists (select 1 from product p where p.id = product_id and p.is_available));
create policy review_public_read   on review       for select using (true);

-- Sellers manage their own rows
create policy seller_self_read   on seller for select using (auth.uid() = id);
create policy seller_self_write  on seller for all    using (auth.uid() = id) with check (auth.uid() = id);

create policy shop_owner_rw on shop for all
  using (exists (select 1 from seller s where s.id = seller_id and s.id = auth.uid()))
  with check (exists (select 1 from seller s where s.id = seller_id and s.id = auth.uid()));

create policy product_owner_rw on product for all
  using (exists (select 1 from shop sh where sh.id = shop_id and sh.seller_id = auth.uid()))
  with check (exists (select 1 from shop sh where sh.id = shop_id and sh.seller_id = auth.uid()));

create policy product_media_owner_rw on product_media for all
  using (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ))
  with check (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ));

create policy variant_owner_rw on product_variant for all
  using (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ))
  with check (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ));

-- Leads: sellers see leads for their products; buyers can insert
create policy lead_owner_read on order_lead for select
  using (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ));
create policy lead_owner_update on order_lead for update
  using (exists (
    select 1 from product p
    join shop sh on sh.id = p.shop_id
    where p.id = product_id and sh.seller_id = auth.uid()
  ));
create policy lead_public_insert on order_lead for insert with check (true);

-- Reviews: buyer writes their own
create policy review_self_write on review for all
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

-- Favorites: buyer owns their list
create policy favorite_self_rw on favorite for all
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

-- ============================================================================
-- Updated-at triggers
-- ============================================================================

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger shop_set_updated_at
  before update on shop for each row execute function set_updated_at();

create trigger product_set_updated_at
  before update on product for each row execute function set_updated_at();
