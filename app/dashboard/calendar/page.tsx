'use client';

import { useEffect, useState } from 'react';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  staff: {
    id: string;
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

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const businessId = 'cmsvo9smi0001ggrde90s8cii';

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view, selectedStaff]);

  async function fetchAppointments() {
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();

      const params = new URLSearchParams({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        ...(selectedStaff && { staffId: selectedStaff }),
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

  function getStartDate() {
    const date = new Date(currentDate);
    if (view === 'day') {
      date.setHours(0, 0, 0, 0);
    } else {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  function getEndDate() {
    const date = new Date(getStartDate());
    if (view === 'day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
    return date;
  }

  function navigateDate(direction: 'prev' | 'next') {
    const date = new Date(currentDate);
    if (view === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(date);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getWeekDays() {
    const start = getStartDate();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  }

  function getAppointmentsForDate(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });
  }

  function getTimeSlots() {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      slots.push(hour);
    }
    return slots;
  }

  function getAppointmentPosition(appointment: Appointment, date: Date) {
    const start = new Date(appointment.startTime);
    const hour = start.getHours();
    const minute = start.getMinutes();
    const top = ((hour - 9) * 60 + minute) * (80 / 60);
    const height = (appointment.service.duration * 80) / 60;
    return { top, height };
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    CONFIRMED: 'bg-green-100 border-green-300 text-green-900',
    COMPLETED: 'bg-blue-100 border-blue-300 text-blue-900',
    CANCELLED: 'bg-red-100 border-red-300 text-red-900',
    NO_SHOW: 'bg-zinc-100 border-zinc-300 text-zinc-900',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Календарь</h1>
          <p className="mt-1 text-sm text-zinc-700">
            {view === 'week' && `${getStartDate().toLocaleDateString('ru-RU')} - ${new Date(getEndDate().getTime() - 1).toLocaleDateString('ru-RU')}`}
            {view === 'day' && currentDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
          >
            Сегодня
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-zinc-300 p-1">
            <button
              onClick={() => setView('day')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                view === 'day' ? 'bg-indigo-600 text-white' : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              День
            </button>
            <button
              onClick={() => setView('week')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                view === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Неделя
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate('prev')}
              className="rounded-lg border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-50 transition"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="rounded-lg border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-50 transition"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 rounded-xl bg-white shadow-sm ring-1 ring-zinc-900/5 overflow-hidden flex flex-col">
        {view === 'week' ? (
          <div className="flex-1 overflow-auto">
            <div className="min-w-[800px]">
              {/* Week Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-zinc-200">
                <div className="grid grid-cols-8">
                  <div className="p-4 border-r border-zinc-200"></div>
                  {getWeekDays().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className="p-4 text-center border-r border-zinc-200 last:border-r-0">
                        <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-zinc-700'}`}>
                          {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                        </div>
                        <div className={`mt-1 text-2xl font-bold ${isToday ? 'text-indigo-600' : 'text-zinc-900'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Grid */}
              <div className="relative">
                <div className="grid grid-cols-8">
                  {/* Time Labels */}
                  <div className="border-r border-zinc-200">
                    {getTimeSlots().map((hour) => (
                      <div key={hour} className="h-20 border-b border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                        {hour}:00
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {getWeekDays().map((date, dayIndex) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    return (
                      <div key={dayIndex} className="relative border-r border-zinc-200 last:border-r-0">
                        {getTimeSlots().map((hour) => (
                          <div key={hour} className="h-20 border-b border-zinc-200" />
                        ))}

                        {/* Appointments */}
                        <div className="absolute inset-0 pointer-events-none">
                          {dayAppointments.map((apt) => {
                            const { top, height } = getAppointmentPosition(apt, date);
                            return (
                              <div
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`absolute left-1 right-1 rounded-lg border-2 p-2 text-xs cursor-pointer pointer-events-auto ${statusColors[apt.status]}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <div className="font-semibold truncate">
                                  {apt.customer.firstName} {apt.customer.lastName}
                                </div>
                                <div className="truncate">{apt.service.name}</div>
                                <div className="truncate">
                                  {new Date(apt.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="min-w-[600px]">
              {/* Day Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 p-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-zinc-700">
                    {currentDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                  </div>
                  <div className="mt-1 text-3xl font-bold text-indigo-600">
                    {currentDate.getDate()}
                  </div>
                  <div className="text-sm text-zinc-700">
                    {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Time Grid */}
              <div className="relative">
                <div className="flex">
                  {/* Time Labels */}
                  <div className="w-20 flex-shrink-0 border-r border-zinc-200">
                    {getTimeSlots().map((hour) => (
                      <div key={hour} className="h-20 border-b border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                        {hour}:00
                      </div>
                    ))}
                  </div>

                  {/* Day Column */}
                  <div className="flex-1 relative">
                    {getTimeSlots().map((hour) => (
                      <div key={hour} className="h-20 border-b border-zinc-200" />
                    ))}

                    {/* Appointments */}
                    <div className="absolute inset-0 pointer-events-none px-2">
                      {getAppointmentsForDate(currentDate).map((apt) => {
                        const { top, height } = getAppointmentPosition(apt, currentDate);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`absolute left-2 right-2 rounded-lg border-2 p-3 cursor-pointer pointer-events-auto ${statusColors[apt.status]}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="font-semibold">
                              {apt.customer.firstName} {apt.customer.lastName}
                            </div>
                            <div className="mt-1 text-sm">{apt.service.name}</div>
                            <div className="mt-1 text-sm">
                              {apt.staff.user.firstName} {apt.staff.user.lastName}
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {new Date(apt.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">Детали записи</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-zinc-600 hover:text-zinc-700"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-700">Клиент</p>
                <p className="mt-1 text-base font-medium text-zinc-900">
                  {selectedAppointment.customer.firstName} {selectedAppointment.customer.lastName}
                </p>
                <p className="text-sm text-zinc-700">{selectedAppointment.customer.phone}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-700">Услуга</p>
                <p className="mt-1 text-base font-medium text-zinc-900">
                  {selectedAppointment.service.name}
                </p>
                <p className="text-sm text-zinc-700">
                  {selectedAppointment.service.duration} мин • {selectedAppointment.service.price.toLocaleString('ru-RU')} ₸
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-700">Мастер</p>
                <p className="mt-1 text-base font-medium text-zinc-900">
                  {selectedAppointment.staff.user.firstName} {selectedAppointment.staff.user.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-700">Время</p>
                <p className="mt-1 text-base font-medium text-zinc-900">
                  {new Date(selectedAppointment.startTime).toLocaleDateString('ru-RU')} в {new Date(selectedAppointment.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-700">Статус</p>
                <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[selectedAppointment.status]}`}>
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
