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

## Deploy to Vercel

The repo includes a `vercel.json` with the monorepo build wired up.

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Leave Root Directory at the repo root — `vercel.json` handles the rest.
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same)
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy.

`pnpm turbo run build --filter=@barakholka/web` is the production build; it's been verified locally against Next.js 15.5.15.

## Next iteration

Seller dashboard (`/seller/*`), Telegram bot (`apps/bot`), admin (`/admin/*`), Kaspi QR stubs (`/api/kaspi/*`).
