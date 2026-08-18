'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  totalCustomers: number;
  totalServices: number;
  totalStaff: number;
  totalRevenue: number;
  upcomingAppointments: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          Ошибка загрузки данных
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Обзор</h1>
        <p className="mt-1 text-sm text-zinc-700">
          Добро пожаловать в панель управления Ornek
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Записи сегодня"
          value={stats.todayAppointments}
          icon={<CalendarIcon />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Записи на неделю"
          value={stats.weekAppointments}
          icon={<ClockIcon />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Клиенты"
          value={stats.totalCustomers}
          icon={<UsersIcon />}
        />
        <StatCard
          title="Выручка"
          value={`${stats.totalRevenue.toLocaleString('ru-RU')} ₸`}
          icon={<CashIcon />}
          trend="+23%"
          trendUp={true}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-zinc-900/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Услуги</h3>
            <Link
              href="/dashboard/services"
              className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
            >
              Управление →
            </Link>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900">
            {stats.totalServices}
          </p>
          <p className="mt-1 text-sm text-zinc-700">Активных услуг</p>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-zinc-900/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Сотрудники</h3>
            <Link
              href="/dashboard/staff"
              className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
            >
              Управление →
            </Link>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900">
            {stats.totalStaff}
          </p>
          <p className="mt-1 text-sm text-zinc-700">Активных мастеров</p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-zinc-900/5">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
            Ближайшие записи
          </h2>
          <Link
            href="/dashboard/appointments"
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
          >
            Смотреть все →
          </Link>
        </div>

        {stats.upcomingAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-700">Нет предстоящих записей</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.upcomingAppointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        <Link
          href="/dashboard/calendar"
          className="group rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8 mb-2 sm:mb-3 opacity-90" />
          <h3 className="text-base sm:text-lg font-semibold">Календарь</h3>
          <p className="mt-1 text-xs sm:text-sm text-indigo-100">
            Просмотр расписания
          </p>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="group rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <ClipboardIcon className="h-7 w-7 sm:h-8 sm:w-8 mb-2 sm:mb-3 opacity-90" />
          <h3 className="text-base sm:text-lg font-semibold">Записи</h3>
          <p className="mt-1 text-xs sm:text-sm text-purple-100">
            Управление записями
          </p>
        </Link>

        <Link
          href="/dashboard/customers"
          className="group rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <UsersIcon className="h-7 w-7 sm:h-8 sm:w-8 mb-2 sm:mb-3 opacity-90" />
          <h3 className="text-base sm:text-lg font-semibold">Клиенты</h3>
          <p className="mt-1 text-xs sm:text-sm text-pink-100">
            База клиентов
          </p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-zinc-900/5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-medium text-zinc-700 truncate">{title}</h3>
        <div className="rounded-lg bg-indigo-50 p-1.5 sm:p-2 text-indigo-600 flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 truncate">{value}</p>
        {trend && (
          <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend} от прошлой недели
          </p>
        )}
      </div>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: any }) {
  const startTime = new Date(appointment.startTime);
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

  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-lg border border-zinc-200 p-3 sm:p-4 hover:bg-zinc-50 transition">
      <div className="flex-shrink-0 text-center">
        <div className="text-xl sm:text-2xl font-bold text-zinc-900">
          {startTime.getDate()}
        </div>
        <div className="text-xs text-zinc-700">
          {startTime.toLocaleDateString('ru-RU', { month: 'short' })}
        </div>
      </div>

      <div className="h-10 sm:h-12 w-px bg-zinc-200" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <p className="font-medium text-sm sm:text-base text-zinc-900 truncate">
            {appointment.customer.firstName} {appointment.customer.lastName}
          </p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[appointment.status]}`}>
            {statusLabels[appointment.status]}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-700 truncate">
          {appointment.service.name} • {appointment.staff.user.firstName} {appointment.staff.user.lastName}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-xs sm:text-sm font-medium text-zinc-900 whitespace-nowrap">
          {startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs sm:text-sm text-zinc-700 hidden sm:block">
          {appointment.service.duration} мин
        </p>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
