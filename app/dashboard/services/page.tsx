'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration: string;
  price: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: '',
    price: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/dashboard/services');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingService(null);
    setFormData({ name: '', description: '', duration: '', price: '' });
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const url = editingService
        ? `/api/dashboard/services/${editingService.id}`
        : '/api/dashboard/services';

      const method = editingService ? 'PATCH' : 'POST';

      const body = {
        name: formData.name,
        description: formData.description || undefined,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save service');
      }

      setShowModal(false);
      fetchServices();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(service: Service) {
    try {
      const res = await fetch(`/api/dashboard/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to toggle service status:', error);
    }
  }

  async function deleteService(service: Service) {
    if (!confirm(`Удалить услугу "${service.name}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/services/${service.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchServices();
      } else {
        const data = await res.json();
        alert(data.error || 'Не удалось удалить услугу');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Ошибка при удалении услуги');
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
          <h1 className="text-2xl font-bold text-zinc-900">Услуги</h1>
          <p className="mt-1 text-sm text-zinc-700">
            Всего услуг: {services.length}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          + Добавить услугу
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-zinc-900/5 p-8 text-center text-zinc-700">
          Нет услуг
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-900/5 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                  service.isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {service.isActive ? 'Активна' : 'Неактивна'}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-zinc-700">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{service.duration} мин</span>
                </div>
                <div className="font-semibold text-zinc-900 text-lg">
                  {service.price.toLocaleString('ru-RU')} ₸
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 flex gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex-1 px-3 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition font-medium"
                >
                  Изменить
                </button>
                <button
                  onClick={() => toggleActive(service)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition font-medium ${
                    service.isActive
                      ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {service.isActive ? 'Отключить' : 'Включить'}
                </button>
                <button
                  onClick={() => deleteService(service)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              {editingService ? 'Редактировать услугу' : 'Новая услуга'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Название услуги *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-500"
                  placeholder="Например: Мужская стрижка"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-500"
                  placeholder="Краткое описание услуги"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Длительность (минут) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-500"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Цена (₸) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 placeholder:text-zinc-500"
                  placeholder="5000"
                />
              </div>

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
