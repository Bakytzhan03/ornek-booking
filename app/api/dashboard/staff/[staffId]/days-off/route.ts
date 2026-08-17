import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

const createDayOffSchema = z.object({
  date: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;
    const { staffId } = await params;

    const body = await request.json();
    const validation = createDayOffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify staff belongs to this business
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, businessId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      );
    }

    const { date, reason } = validation.data;

    // Check if day off already exists
    const existing = await prisma.dayOff.findFirst({
      where: {
        staffId,
        date: new Date(date),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Day off already exists for this date' },
        { status: 400 }
      );
    }

    const dayOff = await prisma.dayOff.create({
      data: {
        staffId,
        date: new Date(date),
        reason,
      },
    });

    return NextResponse.json(dayOff, { status: 201 });
  } catch (error) {
    console.error('Error creating day off:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
