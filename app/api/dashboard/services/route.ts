import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

const createServiceSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(1, 'Длительность должна быть больше 0'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;

    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;

    const body = await request.json();
    const validation = createServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, description, duration, price } = validation.data;

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        duration,
        price,
        isActive: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
