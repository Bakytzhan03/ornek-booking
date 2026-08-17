# Ornek

Production-ready SaaS-платформа для онлайн-бронирования (барбершопы, салоны, массажные студии).

## Стек

- Next.js 16
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Zod

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить БД

**Вариант А: Docker (рекомендуется)**

```bash
docker compose up -d
```

**Вариант Б: Локальный PostgreSQL**

Установите PostgreSQL и создайте БД:
```sql
CREATE DATABASE ornek;
```

Обновите `.env` если нужно изменить credentials.

### 3. Применить миграции

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Заполнить тестовыми данными

```bash
npm run prisma:seed
```

### 5. Запустить dev-сервер

```bash
npm run dev
```

## Структура БД

**Основные сущности:**
- User (роли: platform_admin, business_owner, manager, staff)
- Business (multi-tenant)
- Staff
- Service
- WorkingHours
- Appointment
- Customer
- Payment
- Notification

## Seed данные

Тестовый барбершоп в Алматы:
- Владелец: owner@barbershop.kz / password123
- 2 мастера
- 4 услуги
- 4 клиента
- 4 записи

## Команды

```bash
npm run dev              # Dev сервер
npm run build            # Production build
npm run prisma:generate  # Сгенерировать Prisma Client
npm run prisma:migrate   # Применить миграции
npm run prisma:seed      # Заполнить тестовыми данными
```
