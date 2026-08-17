import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params;

    const appointment = await BookingService.getAppointment(appointmentId, businessId);

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error fetching appointment:', error);

    if (error.message?.includes('not found') || error.message?.includes('not belong')) {
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
