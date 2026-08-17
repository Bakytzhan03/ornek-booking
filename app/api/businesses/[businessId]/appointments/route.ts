import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BookingService } from '@/lib/booking';
import { prisma } from '@/lib/prisma';

const createAppointmentSchema = z.object({
  customerId: z.string().cuid(),
  staffId: z.string().cuid(),
  serviceId: z.string().cuid(),
  startTime: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const body = await request.json();

    const validation = createAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    const appointment = await BookingService.createAppointment({
      businessId,
      ...validation.data,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating appointment:', error);

    if (error.message?.includes('not found') ||
        error.message?.includes('not belong') ||
        error.message?.includes('not active')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('already booked') ||
        error.message?.includes('outside working hours') ||
        error.message?.includes('not working')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { searchParams } = new URL(request.url);

    const filters: any = {
      businessId,
    };

    const staffId = searchParams.get('staffId');
    if (staffId) filters.staffId = staffId;

    const customerId = searchParams.get('customerId');
    if (customerId) filters.customerId = customerId;

    const status = searchParams.get('status');
    if (status) filters.status = status;

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filters.startTime = {};
      if (dateFrom) filters.startTime.gte = new Date(dateFrom);
      if (dateTo) filters.startTime.lte = new Date(dateTo);
    }

    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        customer: true,
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: true,
        payment: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
