import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params;

    const appointment = await BookingService.cancelAppointment(appointmentId, businessId);

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);

    if (error.message?.includes('not found') || error.message?.includes('not belong')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('already cancelled') || error.message?.includes('Cannot cancel')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
