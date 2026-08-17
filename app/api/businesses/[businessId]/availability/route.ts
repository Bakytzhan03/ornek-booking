import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BookingService } from '@/lib/booking';

const availabilitySchema = z.object({
  staffId: z.string().cuid(),
  serviceId: z.string().cuid(),
  date: z.string().transform(str => new Date(str)),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { searchParams } = new URL(request.url);

    const validation = availabilitySchema.safeParse({
      staffId: searchParams.get('staffId'),
      serviceId: searchParams.get('serviceId'),
      date: searchParams.get('date'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { staffId, serviceId, date } = validation.data;

    const slots = await BookingService.getAvailableSlots({
      businessId,
      staffId,
      serviceId,
      date,
    });

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error fetching availability:', error);

    if (error.message?.includes('not found') || error.message?.includes('not active')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
