# Barakholka scaffold — transfer artifact

**Этот файл — временная «переноска» для скаффолда маркетплейса Barakholka.**

Репозиторий `viproman01/skills-introduction-to-github` — форк учебного курса GitHub Skills. Маркетплейсу здесь не место, но MCP-scope Claude в той сессии был ограничен только этим репо, поэтому тарбол закоммичен сюда как единственный доступный канал передачи.

## Как использовать

```bash
# 1. Склонируй ветку и вытащи тарбол
git clone -b claude/barakholka-initial-setup-VYUBO \
  https://github.com/viproman01/skills-introduction-to-github.git /tmp/checkout
cp /tmp/checkout/barakholka-scaffold.tgz ~/Downloads/

# 2. Создай новый репо viproman01/barakholka на GitHub (пустой)
# 3. Распакуй и инициализируй
mkdir ~/code/barakholka && cd ~/code/barakholka
tar -xzf ~/Downloads/barakholka-scaffold.tgz --strip-components=1
git init && git add . && git commit -m "initial scaffold"
git remote add origin git@github.com:viproman01/barakholka.git
git branch -M main && git push -u origin main

# 4. Дальше — по README внутри скаффолда
```

## Что внутри тарбола

- Монорепо: pnpm workspaces + Turbo
- `packages/db/migrations/0001_init.sql` — схема Postgres + RLS + триггеры (PostGIS, pg_trgm, unaccent)
- `packages/db/src/seed.ts` — сид: 1 рынок, 3 зоны, 24 сектора, 20 магазинов, 100 товаров
- `apps/web` — Next.js 15 App Router, Tailwind, MapLibre, Supabase SSR
  - Страницы: `/`, `/map`, `/shops`, `/shop/[id]`, `/product/[id]`, `/search`, `POST /api/lead`

**SHA-256:** `dc4ce163f62365127b86f500878ef575063c58c8a01e5e627336c118886f8cd0`
**Размер:** 18 KB, 39 файлов

## После переноса

Эту ветку (`claude/barakholka-initial-setup-VYUBO`) и файлы `barakholka-scaffold.tgz` + `BARAKHOLKA_SCAFFOLD.md` можно удалить — они посторонние для курса `skills/introduction-to-github`.
