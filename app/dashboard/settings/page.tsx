'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  phone: string;
  email: string;
  createdAt: string;
}

interface BusinessFormData {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    timezone: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBusiness();
  }, []);

  async function fetchBusiness() {
    try {
      const res = await fetch('/api/dashboard/settings');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
        setFormData({
          name: data.name,
          address: data.address,
          city: data.city,
          country: data.country,
          phone: data.phone,
          email: data.email,
          timezone: data.timezone,
        });
      }
    } catch (error) {
      console.error('Failed to fetch business settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setEditing(true);
    setFormError('');
    setSuccessMessage('');
  }

  function cancelEditing() {
    if (business) {
      setFormData({
        name: business.name,
        address: business.address,
        city: business.city,
        country: business.country,
        phone: business.phone,
        email: business.email,
        timezone: business.timezone,
      });
    }
    setEditing(false);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setBusiness(data);
      setEditing(false);
      setSuccessMessage('Настройки успешно обновлены');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Ошибка загрузки настроек
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Настройки</h1>
          <p className="mt-1 text-sm text-zinc-700">
            Информация о вашем бизнесе
          </p>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Редактировать
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Основная информация</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Название бизнеса *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                URL (slug)
              </label>
              <div className="text-sm text-zinc-700 bg-zinc-50 px-4 py-3 rounded-lg">
                {business.slug}
              </div>
              <p className="mt-1 text-xs text-zinc-700">Slug не редактируется</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Телефон *
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.phone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Email *
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.email}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Адрес *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.address}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Город *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.city}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Страна *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-700"
                />
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.country}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Часовой пояс *
              </label>
              {editing ? (
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900"
                >
                  <option value="Asia/Almaty">Asia/Almaty (GMT+6)</option>
                  <option value="Asia/Aqtobe">Asia/Aqtobe (GMT+5)</option>
                  <option value="Asia/Oral">Asia/Oral (GMT+5)</option>
                  <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              ) : (
                <div className="text-sm text-zinc-900 bg-zinc-50 px-4 py-3 rounded-lg">
                  {business.timezone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Дата создания
              </label>
              <div className="text-sm text-zinc-700 bg-zinc-50 px-4 py-3 rounded-lg">
                {new Date(business.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={submitting}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition font-medium disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Действия</h2>
        </div>

        <div className="px-6 py-6">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}
