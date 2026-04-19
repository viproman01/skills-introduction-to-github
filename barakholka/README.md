# Barakholka

Marketplace for the Almaty Barakholka bazaar. Next.js 15 (App Router) + Supabase + MapLibre.

This iteration ships the **foundation + public site**: monorepo, DB schema, seed, landing, map, shops, shop detail, product detail, search. Seller dashboard, Telegram bot, admin, and Kaspi stubs come next session.

## Requirements

- Node 20+, pnpm 9+
- A Supabase Cloud project (URL + anon key + service role key)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for running migrations locally

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase URL + keys
```

Apply the schema to your Supabase project:

```bash
# Option A: copy-paste packages/db/migrations/0001_init.sql into the Supabase SQL editor
# Option B: if you linked the CLI
supabase db push
```

Seed mock data (uses service role key from .env.local):

```bash
pnpm seed
```

Run the web app:

```bash
pnpm dev
# → http://localhost:3000
```

## Structure

```
apps/
  web/        Next.js — public site (landing, map, catalog, product, search)
packages/
  db/         Migrations, seed, generated Supabase types
supabase/     Supabase CLI config + migrations mirror
```

## Next iteration

Seller dashboard (`/seller/*`), Telegram bot (`apps/bot`), admin (`/admin/*`), Kaspi QR stubs (`/api/kaspi/*`).
