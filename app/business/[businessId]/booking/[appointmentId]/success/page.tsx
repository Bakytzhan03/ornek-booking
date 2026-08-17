import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ businessId: string; appointmentId: string }>;
}) {
  const { businessId, appointmentId } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      businessId,
    },
    include: {
      business: true,
      customer: true,
      service: true,
      staff: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  const appointmentDate = new Date(appointment.startTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col items-center justify-center py-12">
          <div className="w-full">
            <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-zinc-900/5 sm:p-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h1 className="mt-6 text-3xl font-bold text-zinc-900">
                  Успешно забронировано!
                </h1>
                <p className="mt-2 text-zinc-700">
                  Подтверждение отправлено на ваш телефон
                </p>
              </div>

              <div className="mt-10 space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
                  <div className="text-sm font-medium text-zinc-500">
                    Номер бронирования
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold text-indigo-600">
                    #{appointment.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl bg-zinc-50 p-6">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Бизнес</div>
                    <div className="mt-1 font-semibold text-zinc-900">
                      {appointment.business.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-zinc-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {appointment.business.address}, {appointment.business.city}
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Услуга</div>
                    <div className="mt-1 font-semibold text-zinc-900">
                      {appointment.service.name}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {appointment.service.duration} минут • {appointment.service.price.toLocaleString('ru-RU')} ₸
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Мастер</div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                        {appointment.staff.user.firstName[0]}{appointment.staff.user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900">
                          {appointment.staff.user.firstName} {appointment.staff.user.lastName}
                        </div>
                        <div className="text-sm text-zinc-700">{appointment.staff.position}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Дата</div>
                      <div className="mt-1 font-semibold text-zinc-900">
                        {appointmentDate.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Время</div>
                      <div className="mt-1 font-semibold text-zinc-900">
                        {appointmentDate.toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Клиент</div>
                    <div className="mt-1 font-semibold text-zinc-900">
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {appointment.customer.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                >
                  На главную
                </Link>
                <Link
                  href={`/business/${businessId}`}
                  className="flex-1 rounded-xl border-2 border-zinc-300 px-6 py-3 text-center font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Забронировать ещё
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-900/5">
              <p className="text-sm text-zinc-700">
                Если вам нужно отменить или перенести запись, позвоните нам
              </p>
              <a
                href={`tel:${appointment.business.phone}`}
                className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {appointment.business.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
