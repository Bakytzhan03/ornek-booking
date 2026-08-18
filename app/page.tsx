import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import HomeContent from './home-content';

// Force dynamic rendering to avoid database queries during build
export const dynamic = 'force-dynamic';

export default async function Home() {
  const businesses = await prisma.business.findMany({
    where: {
      services: {
        some: { isActive: true },
      },
      staff: {
        some: { isActive: true },
      },
    },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
      staff: {
        where: { isActive: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const businessesData = businesses.map(b => ({
    id: b.id,
    name: b.name,
    address: b.address,
    city: b.city,
    services: b.services.map(s => ({ id: s.id, name: s.name, price: s.price })),
    staff: b.staff.map(st => ({ id: st.id })),
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Ornek
            </Link>
            <nav className="flex items-center gap-3 sm:gap-6 lg:gap-8 text-xs sm:text-sm font-medium">
              <Link href="#search" className="hidden sm:inline text-zinc-700 hover:text-zinc-900 transition-colors">
                Найти место
              </Link>
              <Link href="/register" className="hidden sm:inline text-zinc-700 hover:text-zinc-900 transition-colors">
                Для бизнеса
              </Link>
              <Link
                href="/login"
                className="rounded-lg sm:rounded-xl bg-zinc-900 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm text-white hover:bg-zinc-700 transition-colors"
              >
                Войти
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-28 xl:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-zinc-900">
              Онлайн-бронирование
              <br />
              <span className="text-zinc-700 font-normal">для вашего бизнеса</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-700 px-2">
              Забронируйте визит к лучшим барберам, стилистам и мастерам красоты за несколько кликов
            </p>

            {/* Search Bar */}
            <div id="search" className="mt-8 sm:mt-10 relative max-w-xl mx-auto px-2">
              <form className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="location" className="sr-only">
                  Город
                </label>
                <input
                  type="search"
                  id="location"
                  placeholder="Город или район"
                  className="flex-1 h-11 sm:h-12 rounded-xl border border-zinc-300 bg-white px-4 sm:px-5 text-sm sm:text-base placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-colors"
                />
                <button type="submit" className="h-11 sm:h-12 rounded-xl bg-zinc-900 px-6 sm:px-7 text-sm sm:text-base font-medium text-white hover:bg-zinc-700 transition-colors whitespace-nowrap">
                  Найти
                </button>
              </form>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-zinc-700 px-2">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">Мгновенное подтверждение</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">Без предоплаты</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="whitespace-nowrap">Отмена за 24 часа</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <Suspense fallback={<div className="py-16 sm:py-20 bg-zinc-50" />}>
        <HomeContent businesses={businessesData} />
      </Suspense>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 lg:p-12 xl:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">
              Владеете бизнесом?
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-zinc-700 max-w-2xl mx-auto px-2">
              Присоединитесь к Ornek и начните принимать онлайн-записи уже сегодня.
              Бесплатно для начала, без скрытых комиссий.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-zinc-900 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-zinc-700 transition-colors w-full sm:w-auto"
              >
                Зарегистрировать бизнес
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Ornek</h3>
              <p className="mt-2 text-sm text-zinc-700">
                Онлайн-бронирование для вашего бизнеса
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/register" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
                Для бизнеса
              </Link>
              <Link href="/login" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
                Вход
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-200 text-center text-sm text-zinc-700">
            © 2026 Ornek. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}