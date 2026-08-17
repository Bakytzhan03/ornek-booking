import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const workingHoursSchema = z.object({
  workingHours: z.array(z.object({
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().optional(),
  })),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;
    const body = await request.json();

    const validation = workingHoursSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify staff belongs to business
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessId,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Delete existing working hours and create new ones
    await prisma.workingHours.deleteMany({
      where: { staffId },
    });

    const workingHours = await prisma.workingHours.createMany({
      data: validation.data.workingHours.map(wh => ({
        staffId,
        ...wh,
      })),
    });

    // Fetch updated working hours
    const updated = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating working hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
