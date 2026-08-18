'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

type Business = {
  id: string;
  name: string;
  address: string;
  city: string;
  services: Array<{ id: string; name: string; price: number }>;
  staff: Array<{ id: string }>;
};

const categories = [
  { name: 'Барбершопы', slug: 'barbershop' },
  { name: 'Салоны красоты', slug: 'salon' },
  { name: 'Массаж', slug: 'massage' },
  { name: 'Другое', slug: 'other' },
];

const categoryKeywords: Record<string, string[]> = {
  barbershop: ['барбер', 'barbershop', 'стрижка', 'борода', 'усы', 'мужская'],
  salon: ['салон', 'красот', 'маникюр', 'педикюр', 'укладка', 'окрашивание', 'женская'],
  massage: ['массаж', 'massage', 'спа', 'релакс'],
  other: [],
};

function matchesCategory(business: Business, categorySlug: string): boolean {
  if (categorySlug === 'other') return true;

  const keywords = categoryKeywords[categorySlug] || [];
  const searchText = `${business.name} ${business.services.map(s => s.name).join(' ')}`.toLowerCase();

  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

export default function HomeContent({ businesses }: { businesses: Business[] }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [filteredBusinesses, setFilteredBusinesses] = useState(businesses);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
      const filtered = businesses.filter(b => matchesCategory(b, categoryParam));
      setFilteredBusinesses(filtered);
    } else {
      setActiveCategory(null);
      setFilteredBusinesses(businesses);
    }
  }, [categoryParam, businesses]);

  return (
    <>
      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">
              Популярные категории
            </h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-zinc-700">
              Найдите нужного специалиста
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.name}
                  href={isActive ? '/' : `/?category=${category.slug}#businesses`}
                  className={`relative rounded-xl sm:rounded-2xl border p-4 sm:p-6 lg:p-8 text-center transition-all duration-200 cursor-pointer min-h-[80px] sm:min-h-0 flex items-center justify-center ${
                    isActive
                      ? 'border-zinc-900 bg-zinc-900 shadow-lg'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg'
                  }`}
                >
                  <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${
                    isActive ? 'text-white' : 'text-zinc-900'
                  }`}>
                    {category.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Businesses Section */}
      <section id="businesses" className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">
              {activeCategory ? `${categories.find(c => c.slug === activeCategory)?.name}` : 'Доступно сейчас'}
            </h2>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-zinc-700">
              {activeCategory ? `Найдено бизнесов: ${filteredBusinesses.length}` : 'Лучшие специалисты в вашем городе'}
            </p>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-200">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-zinc-900 px-4">
                {activeCategory ? 'Бизнесы в этой категории не найдены' : 'Бизнесы не найдены'}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-zinc-700 px-4">
                {activeCategory ? 'Попробуйте другую категорию' : 'Зарегистрируйте свой бизнес первым'}
              </p>
              {activeCategory ? (
                <Link
                  href="/"
                  className="mt-5 sm:mt-6 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-zinc-900 text-white rounded-xl text-sm sm:text-base font-medium hover:bg-zinc-700 transition-colors"
                >
                  Показать все
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="mt-5 sm:mt-6 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-zinc-900 text-white rounded-xl text-sm sm:text-base font-medium hover:bg-zinc-700 transition-colors"
                >
                  Добавить бизнес
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.id}`}
                  className="group rounded-xl sm:rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-200"
                >
                  {/* Business Image Placeholder */}
                  <div className="aspect-[16/9] bg-zinc-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-medium text-zinc-700 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        Открыто
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors line-clamp-1">
                        {business.name}
                      </h3>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{business.address}, {business.city}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{business.services.length} услуг</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{business.staff.length} мастеров</span>
                      </div>
                    </div>

                    {business.services.length > 0 && (
                      <div className="mb-4 pb-3 sm:pb-4 border-b border-zinc-100">
                        <p className="text-xs font-medium text-zinc-700 mb-2">Популярные услуги</p>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {business.services.slice(0, 3).map((service) => (
                            <span
                              key={service.id}
                              className="text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-100 text-zinc-700 break-words"
                            >
                              {service.name} — {service.price.toLocaleString('ru-RU')} ₸
                            </span>
                          ))}
                          {business.services.length > 3 && (
                            <span className="text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-100 text-zinc-700">
                              +{business.services.length - 3} ещё
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="w-full py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl bg-zinc-900 text-white text-sm sm:text-base font-medium hover:bg-zinc-700 transition-colors text-center">
                      Записаться
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
