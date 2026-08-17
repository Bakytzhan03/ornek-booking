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
  workingHours: any[];
  staffServices: Array<{
    service: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    appointments: number;
  };
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  description: string;
  password: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    description: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const res = await fetch('/api/dashboard/staff');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      description: '',
      password: '',
    });
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(member: Staff) {
    setEditingStaff(member);
    setFormData({
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      phone: member.user.phone || '',
      position: member.position,
      description: member.description || '',
      password: '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const url = editingStaff
        ? `/api/dashboard/staff/${editingStaff.id}`
        : '/api/dashboard/staff';

      const method = editingStaff ? 'PATCH' : 'POST';

      const body: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        position: formData.position,
        description: formData.description || undefined,
      };

      if (!editingStaff && formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save staff');
      }

      setShowModal(false);
      fetchStaff();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member: Staff) {
    try {
      const res = await fetch(`/api/dashboard/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      });

      if (res.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error('Failed to toggle staff status:', error);
    }
  }

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
          <h1 className="text-2xl font-bold text-zinc-900">Сотрудники</h1>
          <p className="mt-1 text-sm text-zinc-700">
            Всего сотрудников: {staff.length}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Добавить сотрудника
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5 p-8 text-center text-zinc-700">
          Нет сотрудников
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-900/5 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {member.user.firstName[0]}{member.user.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      {member.user.firstName} {member.user.lastName}
                    </h3>
                    <p className="text-sm text-zinc-700">{member.position}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {member.isActive ? 'Активен' : 'Неактивен'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm text-zinc-700">{member.user.email}</div>
                {member.user.phone && (
                  <div className="text-sm text-zinc-700">{member.user.phone}</div>
                )}
                <div className="text-sm text-zinc-700">
                  Услуг: {member.staffServices.length}
                </div>
                <div className="text-sm text-zinc-700">
                  Записей: {member._count.appointments}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200">
                <Link
                  href={`/dashboard/staff/${member.id}`}
                  className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 px-3 py-2 text-sm text-center bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                  Управление
                </Link>
                <button
                  onClick={() => openEditModal(member)}
                  className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 px-3 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition font-medium"
                >
                  Изменить
                </button>
                <button
                  onClick={() => toggleActive(member)}
                  className={`flex-1 min-w-full sm:min-w-0 px-3 py-2 text-sm rounded-lg transition font-medium ${
                    member.isActive
                      ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {member.isActive ? 'Деактивировать' : 'Активировать'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              {editingStaff ? 'Редактировать сотрудника' : 'Новый сотрудник'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                    placeholder="Иван"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                    placeholder="Иванов"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingStaff}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-700"
                  placeholder="ivan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                  placeholder="+7 777 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Должность *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                  placeholder="Барбер"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                  placeholder="5 лет опыта"
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Пароль *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingStaff}
                    minLength={6}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                    placeholder="Минимум 6 символов"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition font-medium disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
