import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BookingService } from '@/lib/booking';

const rescheduleSchema = z.object({
  newStartTime: z.string().transform(str => new Date(str)),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params;
    const body = await request.json();

    const validation = rescheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    const appointment = await BookingService.rescheduleAppointment(
      appointmentId,
      businessId,
      validation.data.newStartTime
    );

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);

    if (error.message?.includes('not found') || error.message?.includes('not belong')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('Cannot reschedule') ||
        error.message?.includes('already booked') ||
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
