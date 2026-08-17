'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  staff: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    staffId: '',
    dateFrom: '',
    dateTo: '',
  });

  const businessId = 'cmsvo9smi0001ggrde90s8cii';

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  async function fetchAppointments() {
    try {
      const params = new URLSearchParams({
        ...filters,
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const res = await fetch(`/api/businesses/${businessId}/appointments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appointmentId: string, status: string) {
    try {
      const res = await fetch(`/api/dashboard/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, businessId }),
      });

      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-zinc-100 text-zinc-800',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждено',
    COMPLETED: 'Завершено',
    CANCELLED: 'Отменено',
    NO_SHOW: 'Не явился',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Записи</h1>
          <p className="mt-1 text-sm text-zinc-700">
            Управление всеми записями
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <CalendarIcon className="h-5 w-5" />
          Календарь
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/5">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Статус
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-zinc-900"
            >
              <option value="">Все статусы</option>
              <option value="PENDING">Ожидает</option>
              <option value="CONFIRMED">Подтверждено</option>
              <option value="COMPLETED">Завершено</option>
              <option value="CANCELLED">Отменено</option>
              <option value="NO_SHOW">Не явился</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Дата от
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Дата до
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-zinc-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', staffId: '', dateFrom: '', dateTo: '' })}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-900/5 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-700">Записи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Дата и время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Услуга
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Мастер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {appointments.map((appointment) => {
                  const startTime = new Date(appointment.startTime);
                  return (
                    <tr key={appointment.id} className="hover:bg-zinc-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-900">
                          {startTime.toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-sm text-zinc-700">
                          {startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">
                          {appointment.customer.firstName} {appointment.customer.lastName}
                        </div>
                        <div className="text-sm text-zinc-700">
                          {appointment.customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-900">{appointment.service.name}</div>
                        <div className="text-sm text-zinc-700">
                          {appointment.service.duration} мин • {appointment.service.price.toLocaleString('ru-RU')} ₸
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {appointment.staff.user.firstName} {appointment.staff.user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[appointment.status]}`}>
                          {statusLabels[appointment.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {appointment.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(appointment.id, 'CONFIRMED')}
                              className="text-green-600 hover:text-green-900 transition"
                              title="Подтвердить"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                            <>
                              <button
                                onClick={() => updateStatus(appointment.id, 'COMPLETED')}
                                className="text-blue-600 hover:text-blue-900 transition"
                                title="Завершить"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => updateStatus(appointment.id, 'NO_SHOW')}
                                className="text-zinc-600 hover:text-zinc-900 transition"
                                title="Не явился"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => updateStatus(appointment.id, 'CANCELLED')}
                                className="text-red-600 hover:text-red-900 transition"
                                title="Отменить"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-900/5">
          <p className="text-sm text-zinc-700">Всего записей</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{appointments.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-900/5">
          <p className="text-sm text-zinc-700">Ожидают</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {appointments.filter(a => a.status === 'PENDING').length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-900/5">
          <p className="text-sm text-zinc-700">Подтверждено</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {appointments.filter(a => a.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-900/5">
          <p className="text-sm text-zinc-700">Завершено</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'COMPLETED').length}
          </p>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
