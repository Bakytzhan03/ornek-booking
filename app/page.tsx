import Link from 'next/link';
import { prisma } from '@/lib/prisma';

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
        take: 3,
        orderBy: { price: 'asc' },
      },
      staff: {
        where: { isActive: true },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const categories = [
    { name: 'Барбершопы', slug: 'barbershop', count: 0 },
    { name: 'Салоны красоты', slug: 'salon', count: 0 },
    { name: 'Массаж', slug: 'massage', count: 0 },
    { name: 'Другое', slug: 'other', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-zinc-900 tracking-tight">
              Ornek
            </Link>
            <nav className="flex items-center gap-8 text-sm font-medium">
              <Link href="#search" className="text-zinc-700 hover:text-zinc-900 transition-colors">
                Найти место
              </Link>
              <Link href="/register" className="text-zinc-700 hover:text-zinc-900 transition-colors">
                Для бизнеса
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 transition-colors"
              >
                Войти
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Онлайн-бронирование
              <br />
              <span className="text-zinc-700 font-normal">для вашего бизнеса</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-700 sm:text-xl">
              Забронируйте визит к лучшим барберам, стилистам и мастерам красоты за несколько кликов
            </p>

            {/* Search Bar */}
            <div id="search" className="mt-10 relative max-w-xl mx-auto">
              <form className="flex gap-2">
                <label htmlFor="location" className="sr-only">
                  Город
                </label>
                <input
                  type="search"
                  id="location"
                  placeholder="Город или район"
                  className="flex-1 h-12 rounded-xl border border-zinc-300 bg-white px-5 text-base placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-colors"
                />
                <button type="submit" className="h-12 rounded-xl bg-zinc-900 px-7 text-base font-medium text-white hover:bg-zinc-700 transition-colors">
                  Найти
                </button>
              </form>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-700">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Мгновенное подтверждение
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Без предоплаты
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Отмена за 24 часа
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Популярные категории
            </h2>
            <p className="mt-3 text-lg text-zinc-700">
              Найдите нужного специалиста
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 text-center"
              >
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900">
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Businesses Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Доступно сейчас
            </h2>
            <p className="mt-3 text-lg text-zinc-700">
              Лучшие специалисты в вашем городе
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900">
                Бизнесы не найдены
              </h3>
              <p className="mt-2 text-zinc-700">
                Зарегистрируйте свой бизнес первым
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
              >
                Добавить бизнес
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.id}`}
                  className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-200"
                >
                  {/* Business Image Placeholder */}
                  <div className="aspect-[16/9] bg-zinc-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        Открыто
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors line-clamp-1">
                        {business.name}
                      </h3>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <svg className="h-4 w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{business.address}, {business.city}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <svg className="h-4 w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{business.services.length} услуг</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <svg className="h-4 w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{business.staff.length} мастеров</span>
                      </div>
                    </div>

                    {business.services.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-zinc-100">
                        <p className="text-xs font-medium text-zinc-700 mb-2">Популярные услуги</p>
                        <div className="flex flex-wrap gap-1.5">
                          {business.services.slice(0, 3).map((service) => (
                            <span
                              key={service.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700"
                            >
                              {service.name} — {service.price.toLocaleString('ru-RU')} ₸
                            </span>
                          ))}
                          {business.services.length > 3 && (
                            <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700">
                              +{business.services.length - 3} ещё
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors text-center">
                      Записаться
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 lg:p-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Владеете бизнесом?
            </h2>
            <p className="mt-4 text-lg text-zinc-700 max-w-2xl mx-auto">
              Присоединитесь к Ornek и начните принимать онлайн-записи уже сегодня.
              Бесплатно для начала, без скрытых комиссий.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
              >
                Зарегистрировать бизнес
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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