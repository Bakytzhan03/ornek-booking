import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const updateStaffSchema = z.object({
  position: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;

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
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
        },
        appointments: {
          where: {
            startTime: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          include: {
            customer: true,
            service: true,
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
          },
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
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;
    const body = await request.json();

    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Verify staff belongs to business
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

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: validation.data,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workingHours: true,
        staffServices: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
