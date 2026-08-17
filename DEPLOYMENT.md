# Ornek - Production Deployment Guide

## Environment Variables Required

### 1. Database (Neon)
```
DATABASE_URL="postgresql://username:password@host.neon.tech:5432/database?sslmode=require"
```

### 2. Session Secret
```
SESSION_SECRET="your-32-character-or-longer-secret-key"
```
Generate with: `openssl rand -base64 32`

### 3. Node Environment
```
NODE_ENV="production"
```

## Neon Setup Steps

1. Create Neon project at https://neon.tech
2. Get connection string from dashboard
3. Copy **pooled connection string** (ends with `?sslmode=require`)
4. Add to Vercel environment variables

## Vercel Setup Steps

1. Import GitHub repository
2. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate new)
   - `NODE_ENV=production`
3. Deploy will automatically run:
   - `npm install`
   - `prisma generate`
   - `next build`

## Database Migration (Production)

After first deploy, run migrations:
```bash
# In Vercel project settings → Functions → CLI
npx prisma migrate deploy
npx prisma db seed
```

Or use Neon SQL Editor to run migration files manually.

## Current Production Readiness

✅ Build passes
✅ ENV variables properly configured
✅ Prisma uses DATABASE_URL
✅ Session uses SESSION_SECRET
✅ Secure cookies in production
✅ No hardcoded secrets
✅ .env.example created
✅ Migrations ready
