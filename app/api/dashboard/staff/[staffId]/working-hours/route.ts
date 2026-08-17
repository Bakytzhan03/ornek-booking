import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

const workingHoursItemSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
});

const updateWorkingHoursSchema = z.object({
  workingHours: z.array(workingHoursItemSchema),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;
    const { staffId } = await params;

    const body = await request.json();
    const validation = updateWorkingHoursSchema.safeParse(body);

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

    const { workingHours } = validation.data;

    // Update working hours in transaction
    await prisma.$transaction(async (tx) => {
      // Deactivate all existing working hours
      await tx.workingHours.updateMany({
        where: { staffId },
        data: { isActive: false },
      });

      // Create or activate working hours
      for (const wh of workingHours) {
        const existing = await tx.workingHours.findFirst({
          where: {
            staffId,
            dayOfWeek: wh.dayOfWeek,
          },
        });

        if (existing) {
          await tx.workingHours.update({
            where: { id: existing.id },
            data: {
              startTime: wh.startTime,
              endTime: wh.endTime,
              isActive: true,
            },
          });
        } else {
          await tx.workingHours.create({
            data: {
              staffId,
              dayOfWeek: wh.dayOfWeek,
              startTime: wh.startTime,
              endTime: wh.endTime,
              isActive: true,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating working hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
