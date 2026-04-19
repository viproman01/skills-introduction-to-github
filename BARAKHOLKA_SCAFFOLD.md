# Barakholka scaffold — transfer artifact

**Этот файл и каталог `barakholka/` — временная «переноска» для маркетплейса.**

Репозиторий `viproman01/skills-introduction-to-github` — форк учебного курса GitHub Skills. Маркетплейсу здесь не место, но MCP-scope Claude в этой сессии ограничен только этим репо, поэтому скаффолд пока живёт здесь как:

- `barakholka/` — распакованный исходник (можно листать на GitHub, чтобы видеть изменения)
- `barakholka-scaffold.tgz` — тот же скаффолд одним архивом для быстрой выкачки

## Текущая ветка: `claude/barakholka-ozon-style-redesign`

OZON-стиль интерфейса:
- Primary blue `#005bff`, accent pink `#f91155`
- Двухрядный sticky header: логотип + кнопка «Каталог» + поиск + иконки (Войти / Заказы / Избранное / Корзина)
- Чипы категорий + блок «Алматы · Укажите адрес»
- Карточки товаров с heart-иконкой, крупная цена сверху
- Hero-промо с градиентом и CTA
- Раздел «Рекомендуем» (товары) + «Популярные магазины»

## Перенос в боевой репо

```bash
# 1. Скачай тарбол одним файлом
curl -L -o barakholka.tgz \
  https://github.com/viproman01/skills-introduction-to-github/raw/claude/barakholka-ozon-style-redesign/barakholka-scaffold.tgz

# 2. Создай новый пустой репо viproman01/barakholka на GitHub
# 3. Распакуй и инициализируй
mkdir ~/code/barakholka && cd ~/code/barakholka
tar -xzf ../barakholka.tgz --strip-components=1
git init && git add . && git commit -m "initial scaffold (OZON-style)"
git remote add origin git@github.com:viproman01/barakholka.git
git branch -M main && git push -u origin main

# 4. Дальше — по README внутри скаффолда (env, миграция, seed, dev)
```

## После переноса

Удали ветки `claude/barakholka-*` и файлы `barakholka/`, `barakholka-scaffold.tgz`, `BARAKHOLKA_SCAFFOLD.md` — посторонние для курса.
