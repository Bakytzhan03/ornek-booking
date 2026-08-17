# СРОЧНО: Настройка Environment Variables в Vercel

## Проблема
Production deploy прошёл, но в Vercel НЕ настроены environment variables.
Сайт падает с ошибкой P2021, потому что:
1. DATABASE_URL отсутствует
2. Prisma не может подключиться к database

## Решение: Добавить ENV в Vercel Dashboard

### Шаг 1: Открыть Vercel Dashboard
https://vercel.com/solo-f917/ornek/settings/environment-variables

### Шаг 2: Добавить Environment Variables

#### 1. DATABASE_URL
- Name: `DATABASE_URL`
- Value: `<твой Neon pooled connection string>`
- Environments: ✅ Production, ✅ Preview, ✅ Development

Получить из Neon dashboard:
- https://console.neon.tech
- Выбрать проект
- Connection Details → Pooled connection
- Скопировать строку (с `?sslmode=require`)

#### 2. SESSION_SECRET
- Name: `SESSION_SECRET`
- Value: сгенерировать новый секрет
- Environments: ✅ Production, ✅ Preview, ✅ Development

Сгенерировать:
```bash
openssl rand -base64 32
```

#### 3. NODE_ENV
- Name: `NODE_ENV`
- Value: `production`
- Environments: ✅ Production

### Шаг 3: Redeploy
После добавления ENV в Vercel dashboard:
1. Vercel → Deployments
2. Последний deployment → ... → Redeploy
3. Или push новый commit в GitHub

### Шаг 4: Применить Миграции
После успешного redeploy с DATABASE_URL:

```bash
cd C:\Users\Erkyn\Documents\ornek
vercel env pull .env.production --environment=production
npx prisma migrate deploy
```

Или через Neon SQL Editor выполнить:
- `prisma/migrations/20260816103553_init/migration.sql`
- `prisma/migrations/20260816203916_add_staff_services_and_days_off/migration.sql`

## Текущий статус
❌ DATABASE_URL не настроен в Vercel
❌ SESSION_SECRET не настроен в Vercel
❌ Migrations не применены
❌ Сайт не работает

## После настройки ENV
✅ Redeploy с правильным DATABASE_URL
✅ Применить migrations
✅ Сайт заработает
