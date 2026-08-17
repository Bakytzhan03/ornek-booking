import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  address: z.string().min(1, 'Адрес обязателен').max(500),
  city: z.string().min(1, 'Город обязателен').max(100),
  country: z.string().min(1, 'Страна обязательна').max(100),
  phone: z.string().min(1, 'Телефон обязателен').max(50),
  email: z.string().email('Неверный формат email'),
  timezone: z.string().min(1, 'Часовой пояс обязателен'),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;

    const body = await request.json();
    const validation = updateBusinessSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, address, city, country, phone, email, timezone } = validation.data;

    // Verify business exists and belongs to authenticated user
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        address,
        city,
        country,
        phone,
        email,
        timezone,
      },
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
