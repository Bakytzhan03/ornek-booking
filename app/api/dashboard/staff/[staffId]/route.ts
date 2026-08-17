import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

const updateStaffSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  position: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;
    const { staffId } = await params;

    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        workingHours: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        staffServices: {
          include: {
            service: true,
          },
        },
        daysOff: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;
    const { staffId } = await params;

    const body = await request.json();
    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify staff belongs to this business
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      );
    }

    const { firstName, lastName, phone, position, description, isActive } = validation.data;

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if user fields provided
      if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: existingStaff.userId },
          data: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(phone !== undefined && { phone }),
          },
        });
      }

      // Update staff
      const staff = await tx.staff.update({
        where: { id: staffId },
        data: {
          ...(position !== undefined && { position }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return staff;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
