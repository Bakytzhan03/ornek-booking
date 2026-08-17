import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    const staff = await prisma.staff.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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
        appointments: {
          where: {
            startTime: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { startTime: 'asc' },
          take: 1,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
