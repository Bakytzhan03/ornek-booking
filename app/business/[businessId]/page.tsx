import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
      staff: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          workingHours: {
            where: { isActive: true },
          },
          staffServices: {
            include: {
              service: true,
            },
          },
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-indigo-100 hover:text-white transition group"
            >
              <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад к поиску
            </Link>

            <div className="mt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-100 text-sm font-medium mb-4 backdrop-blur-sm border border-green-400/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Открыто сейчас
              </div>

              <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl mb-4">
                {business.name}
              </h1>

              {business.description && (
                <p className="text-lg text-indigo-100 max-w-2xl mb-6">
                  {business.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{business.address}, {business.city}</span>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{business.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Services Section */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Наши услуги</h2>
            <p className="text-zinc-700">Выберите услугу для бронирования</p>
          </div>

          {business.services.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-700">Услуги временно недоступны</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {business.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/business/${businessId}/book?serviceId=${service.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200 hover:border-indigo-300 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 group-hover:text-indigo-600 transition mb-2">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-zinc-700 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-700">
                          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{service.duration} мин</span>
                        </div>
                        <div className="text-xl font-bold text-indigo-600">
                          {service.price.toLocaleString('ru-RU')} ₸
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Staff Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Наши мастера</h2>
            <p className="text-zinc-700">Профессиональные специалисты</p>
          </div>

          {business.staff.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-700">Информация о мастерах скоро появится</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {business.staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">
                          {member.user.firstName} {member.user.lastName}
                        </h3>
                        <p className="text-sm text-zinc-700">{member.position}</p>
                      </div>
                    </div>

                    {member.description && (
                      <p className="text-sm text-zinc-700 mb-4 line-clamp-2">
                        {member.description}
                      </p>
                    )}

                    {member.staffServices.length > 0 && (
                      <div className="pt-4 border-t border-zinc-100">
                        <p className="text-xs font-medium text-zinc-700 mb-2">Специализация</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.staffServices.slice(0, 3).map((ss) => (
                            <span
                              key={ss.id}
                              className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
                            >
                              {ss.service.name}
                            </span>
                          ))}
                          {member.staffServices.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                              +{member.staffServices.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold">Ornek</h3>
              <p className="mt-2 text-zinc-400 text-sm">
                Онлайн-бронирование для вашего бизнеса
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-zinc-400 hover:text-white transition text-sm">
                Главная
              </Link>
              <Link href="/register" className="text-zinc-400 hover:text-white transition text-sm">
                Для бизнеса
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-700">
            © 2026 Ornek. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
