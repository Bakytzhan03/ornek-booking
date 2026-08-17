'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Staff {
  id: string;
  position: string;
  description: string | null;
  isActive: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  workingHours: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  staffServices: Array<{
    id: string;
    service: {
      id: string;
      name: string;
    };
  }>;
  daysOff: Array<{
    id: string;
    date: string;
    reason?: string;
  }>;
}

interface Service {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Понедельник' },
  { value: 'TUESDAY', label: 'Вторник' },
  { value: 'WEDNESDAY', label: 'Среда' },
  { value: 'THURSDAY', label: 'Четверг' },
  { value: 'FRIDAY', label: 'Пятница' },
  { value: 'SATURDAY', label: 'Суббота' },
  { value: 'SUNDAY', label: 'Воскресенье' },
];

export default function StaffDetailPage({ params }: { params: Promise<{ staffId: string }> }) {
  const router = useRouter();
  const [staffId, setStaffId] = useState<string>('');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'hours' | 'daysoff'>('services');

  // Staff Services State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);

  // Working Hours State
  const [workingHours, setWorkingHours] = useState<Record<string, { startTime: string; endTime: string; isActive: boolean }>>({});
  const [savingHours, setSavingHours] = useState(false);

  // Days Off State
  const [newDayOff, setNewDayOff] = useState({ date: '', reason: '' });
  const [addingDayOff, setAddingDayOff] = useState(false);

  useEffect(() => {
    params.then(p => {
      setStaffId(p.staffId);
      fetchData(p.staffId);
    });
  }, []);

  async function fetchData(id: string) {
    try {
      const [staffRes, servicesRes] = await Promise.all([
        fetch(`/api/dashboard/staff/${id}`),
        fetch('/api/dashboard/services'),
      ]);

      if (staffRes.status === 401 || servicesRes.status === 401) {
        router.push('/login');
        return;
      }

      if (staffRes.ok && servicesRes.ok) {
        const staffData = await staffRes.json();
        const servicesData = await servicesRes.json();

        setStaff(staffData);
        setAllServices(servicesData);

        // Initialize selected services
        setSelectedServices(staffData.staffServices.map((ss: any) => ss.service.id));

        // Initialize working hours
        const hoursMap: Record<string, any> = {};
        DAYS_OF_WEEK.forEach(day => {
          const existing = staffData.workingHours.find((wh: any) => wh.dayOfWeek === day.value);
          if (existing) {
            hoursMap[day.value] = {
              startTime: existing.startTime,
              endTime: existing.endTime,
              isActive: existing.isActive,
            };
          } else {
            hoursMap[day.value] = {
              startTime: '09:00',
              endTime: '18:00',
              isActive: false,
            };
          }
        });
        setWorkingHours(hoursMap);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveServices() {
    setSavingServices(true);
    try {
      const res = await fetch(`/api/dashboard/staff/${staffId}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: selectedServices }),
      });

      if (res.ok) {
        fetchData(staffId);
      }
    } catch (error) {
      console.error('Failed to save services:', error);
    } finally {
      setSavingServices(false);
    }
  }

  async function saveWorkingHours() {
    setSavingHours(true);
    try {
      const hours = Object.entries(workingHours)
        .filter(([_, data]) => data.isActive)
        .map(([dayOfWeek, data]) => ({
          dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
        }));

      const res = await fetch(`/api/dashboard/staff/${staffId}/working-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours: hours }),
      });

      if (res.ok) {
        fetchData(staffId);
      }
    } catch (error) {
      console.error('Failed to save working hours:', error);
    } finally {
      setSavingHours(false);
    }
  }

  async function addDayOff() {
    if (!newDayOff.date) return;

    setAddingDayOff(true);
    try {
      const res = await fetch(`/api/dashboard/staff/${staffId}/days-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDayOff.date,
          reason: newDayOff.reason || undefined,
        }),
      });

      if (res.ok) {
        setNewDayOff({ date: '', reason: '' });
        fetchData(staffId);
      }
    } catch (error) {
      console.error('Failed to add day off:', error);
    } finally {
      setAddingDayOff(false);
    }
  }

  async function removeDayOff(dayOffId: string) {
    if (!confirm('Удалить этот выходной день?')) return;

    try {
      const res = await fetch(`/api/dashboard/staff/${staffId}/days-off/${dayOffId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData(staffId);
      }
    } catch (error) {
      console.error('Failed to remove day off:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Сотрудник не найден
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/staff"
          className="text-zinc-700 hover:text-zinc-900"
        >
          ← Назад
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            {staff.user.firstName} {staff.user.lastName}
          </h1>
          <p className="text-sm text-zinc-500">{staff.position}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Услуги
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hours'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Рабочие часы
          </button>
          <button
            onClick={() => setActiveTab('daysoff')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'daysoff'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Выходные дни
          </button>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Услуги сотрудника</h2>

          <div className="space-y-3 mb-6">
            {allServices.map(service => (
              <label
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:border-indigo-300 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServices([...selectedServices, service.id]);
                    } else {
                      setSelectedServices(selectedServices.filter(id => id !== service.id));
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-900">{service.name}</span>
              </label>
            ))}
          </div>

          <button
            onClick={saveServices}
            disabled={savingServices}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
          >
            {savingServices ? 'Сохранение...' : 'Сохранить услуги'}
          </button>
        </div>
      )}

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Рабочие часы</h2>

          <div className="space-y-4 mb-6">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="flex items-center gap-4">
                <label className="flex items-center gap-2 w-40">
                  <input
                    type="checkbox"
                    checked={workingHours[day.value]?.isActive || false}
                    onChange={(e) => {
                      setWorkingHours({
                        ...workingHours,
                        [day.value]: {
                          ...workingHours[day.value],
                          isActive: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-900">{day.label}</span>
                </label>

                {workingHours[day.value]?.isActive && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={workingHours[day.value]?.startTime || '09:00'}
                      onChange={(e) => {
                        setWorkingHours({
                          ...workingHours,
                          [day.value]: {
                            ...workingHours[day.value],
                            startTime: e.target.value,
                          },
                        });
                      }}
                      className="px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900"
                    />
                    <span className="text-zinc-500">—</span>
                    <input
                      type="time"
                      value={workingHours[day.value]?.endTime || '18:00'}
                      onChange={(e) => {
                        setWorkingHours({
                          ...workingHours,
                          [day.value]: {
                            ...workingHours[day.value],
                            endTime: e.target.value,
                          },
                        });
                      }}
                      className="px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveWorkingHours}
            disabled={savingHours}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
          >
            {savingHours ? 'Сохранение...' : 'Сохранить часы'}
          </button>
        </div>
      )}

      {/* Days Off Tab */}
      {activeTab === 'daysoff' && (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Выходные дни</h2>

          <div className="mb-6 p-4 bg-zinc-50 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Дата
              </label>
              <input
                type="date"
                value={newDayOff.date}
                onChange={(e) => setNewDayOff({ ...newDayOff, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Причина (опционально)
              </label>
              <input
                type="text"
                value={newDayOff.reason}
                onChange={(e) => setNewDayOff({ ...newDayOff, reason: e.target.value })}
                placeholder="Отпуск"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-500"
              />
            </div>

            <button
              onClick={addDayOff}
              disabled={!newDayOff.date || addingDayOff}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
            >
              {addingDayOff ? 'Добавление...' : 'Добавить выходной'}
            </button>
          </div>

          {staff.daysOff.length > 0 ? (
            <div className="space-y-3">
              {staff.daysOff.map(dayOff => (
                <div
                  key={dayOff.id}
                  className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-zinc-900">
                      {new Date(dayOff.date).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    {dayOff.reason && (
                      <div className="text-sm text-zinc-500">{dayOff.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeDayOff(dayOff.id)}
                    className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              Нет запланированных выходных дней
            </div>
          )}
        </div>
      )}
    </div>
  );
}
