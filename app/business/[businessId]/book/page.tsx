'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Business = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Staff = {
  id: string;
  position: string;
  user: {
    firstName: string;
    lastName: string;
  };
};

type TimeSlot = {
  start: string;
  end: string;
};

const steps = [
  { id: 1, name: 'Услуга', icon: '✂️' },
  { id: 2, name: 'Мастер', icon: '👤' },
  { id: 3, name: 'Дата и время', icon: '📅' },
  { id: 4, name: 'Данные', icon: '📝' },
  { id: 5, name: 'Подтверждение', icon: '✓' },
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState<string>('');

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => {
      setBusinessId(p.businessId);
      const serviceId = searchParams.get('serviceId');
      if (serviceId) setSelectedServiceId(serviceId);
    });
  }, [params, searchParams]);

  useEffect(() => {
    if (!businessId) return;

    fetch(`/api/businesses/${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        setBusiness(data);
        setServices(data.services || []);
        setStaff(data.staff || []);
      })
      .catch(() => setError('Не удалось загрузить данные'));
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !selectedServiceId || !selectedStaffId || !selectedDate) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setError('');

    fetch(
      `/api/businesses/${businessId}/availability?serviceId=${selectedServiceId}&staffId=${selectedStaffId}&date=${selectedDate}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить слоты');
        return res.json();
      })
      .then((data) => {
        setSlots(data.slots || []);
        setSelectedSlot(null);
      })
      .catch((err) => {
        setError(err.message);
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [businessId, selectedServiceId, selectedStaffId, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedServiceId || !selectedStaffId) return;

    setLoading(true);
    setError('');

    try {
      const customerRes = await fetch(`/api/businesses/${businessId}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      let customerId: string;

      if (!customerRes.ok) {
        const existingCustomers = await fetch(
          `/api/businesses/${businessId}/customers?phone=${encodeURIComponent(phone)}`
        ).then((r) => r.json());

        if (existingCustomers && existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
        } else {
          throw new Error('Не удалось создать клиента');
        }
      } else {
        const customer = await customerRes.json();
        customerId = customer.id;
      }

      const appointmentRes = await fetch(`/api/businesses/${businessId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          staffId: selectedStaffId,
          serviceId: selectedServiceId,
          startTime: selectedSlot.start,
        }),
      });

      if (!appointmentRes.ok) {
        const errorData = await appointmentRes.json();
        throw new Error(errorData.error || 'Не удалось создать запись');
      }

      const appointment = await appointmentRes.json();
      router.push(`/business/${businessId}/booking/${appointment.id}/success`);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (!selectedServiceId) return 1;
    if (!selectedStaffId) return 2;
    if (!selectedDate || !selectedSlot) return 3;
    if (!firstName || !lastName || !phone) return 4;
    return 5;
  };

  const currentStep = getCurrentStep();
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedStaffMember = staff.find((s) => s.id === selectedStaffId);

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    return maxDate.toISOString().split('T')[0];
  };

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-zinc-700">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link
              href={`/business/${businessId}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {business.name}
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-zinc-900">Бронирование</h1>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Progress" className="py-6">
            <ol className="flex items-center justify-between">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className="relative flex-1">
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute left-1/2 top-4 hidden h-0.5 w-full -translate-x-1/2 md:block">
                      <div className={`h-full ${step.id < currentStep ? 'bg-indigo-600' : 'bg-zinc-200'}`} />
                    </div>
                  )}
                  <div className="group relative flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                        step.id < currentStep
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : step.id === currentStep
                          ? 'border-indigo-600 bg-white text-indigo-600'
                          : 'border-zinc-300 bg-white text-zinc-400'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </span>
                    <span className={`mt-2 text-xs font-medium ${step.id <= currentStep ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 sm:py-12">
          {error && (
            <div className="mb-8 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-zinc-900 mb-4">
                Выберите услугу
              </label>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selectedServiceId === service.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-900">{service.name}</div>
                        <div className="mt-1 text-sm text-zinc-700">
                          {service.duration} мин • {service.price.toLocaleString('ru-RU')} ₸
                        </div>
                      </div>
                      {selectedServiceId === service.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedServiceId && (
              <div>
                <label className="block text-lg font-semibold text-zinc-900 mb-4">
                  Выберите мастера
                </label>
                <div className="grid gap-3">
                  {staff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedStaffId(member.id)}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        selectedStaffId === member.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="text-sm text-zinc-700">{member.position}</div>
                          </div>
                        </div>
                        {selectedStaffId === member.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedStaffId && (
              <div>
                <label className="block text-lg font-semibold text-zinc-900 mb-4">
                  Выберите дату
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="block w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            )}

            {selectedDate && (
              <div>
                <label className="block text-lg font-semibold text-zinc-900 mb-4">
                  Выберите время
                </label>
                {loadingSlots ? (
                  <div className="rounded-xl bg-white p-8 text-center text-sm text-zinc-700">
                    Загрузка доступных слотов...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl bg-zinc-100 p-8 text-center text-sm text-zinc-700">
                    Нет доступных слотов на выбранную дату. Попробуйте другой день.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot, idx) => {
                      const startTime = new Date(slot.start);
                      const timeStr = startTime.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border-2 py-3 text-center text-sm font-medium transition ${
                            selectedSlot?.start === slot.start
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-zinc-200 bg-white text-zinc-900 hover:border-indigo-300'
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div>
                <label className="block text-lg font-semibold text-zinc-900 mb-4">
                  Ваши данные
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                    className="block w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                    className="block w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (700) 123-45-67"
                    className="block w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>
            )}

            {selectedSlot && firstName && lastName && phone && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/5">
                <h3 className="text-lg font-semibold text-zinc-900">Детали бронирования</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-700">Услуга</dt>
                    <dd className="font-medium text-zinc-900">{selectedService?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-700">Мастер</dt>
                    <dd className="font-medium text-zinc-900">
                      {selectedStaffMember?.user.firstName} {selectedStaffMember?.user.lastName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-700">Дата</dt>
                    <dd className="font-medium text-zinc-900">
                      {new Date(selectedDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-700">Время</dt>
                    <dd className="font-medium text-zinc-900">
                      {new Date(selectedSlot.start).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-3">
                    <dt className="font-semibold text-zinc-900">Стоимость</dt>
                    <dd className="text-xl font-bold text-indigo-600">
                      {selectedService?.price.toLocaleString('ru-RU')} ₸
                    </dd>
                  </div>
                </dl>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-4 text-center font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Бронируем...' : 'Подтвердить бронирование'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
