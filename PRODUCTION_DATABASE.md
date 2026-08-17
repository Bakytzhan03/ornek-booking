# Production Database Setup

## Problem
Homepage делает database query во время Next.js build (static prerender), но production database ещё пустая → build падает с ошибкой P2021.

## Solution
Homepage переключена на dynamic rendering с `export const dynamic = 'force-dynamic'`.

Теперь:
- Build НЕ требует доступа к database
- Database queries выполняются только при HTTP requests
- Build проходит с пустой production database

## Steps After First Successful Deploy

### 1. Apply Migrations to Production Database

В Vercel Dashboard → Settings → Functions → или через CLI:

```bash
# Вариант 1: Vercel CLI (рекомендуется)
vercel env pull .env.production
npx prisma migrate deploy --env .env.production
```

Или в Neon SQL Editor выполнить миграции вручную:
```sql
-- Запустить содержимое всех файлов из prisma/migrations/ по порядку:
-- 1. prisma/migrations/20260816103553_init/migration.sql
-- 2. prisma/migrations/20260816203916_add_staff_services_and_days_off/migration.sql
```

### 2. Seed Production Database (опционально)

```bash
npm run prisma:seed
```

## Environment Variables Required on Vercel

✅ DATABASE_URL - pooled connection от Neon
✅ SESSION_SECRET - сгенерировать: `openssl rand -base64 32`
✅ NODE_ENV=production

## Verification

После применения миграций:
1. Homepage должна открываться (пока пустая — нет бизнесов)
2. Можно зарегистрироваться и создать бизнес
3. Все CRUD операции работают

## Important Notes

- Homepage теперь **dynamic** (server-rendered on demand)
- Build НЕ требует database connection
- Migrations нужно применить ПОСЛЕ первого успешного deploy
- НЕ используйте `prisma db push` на production — только `prisma migrate deploy`
