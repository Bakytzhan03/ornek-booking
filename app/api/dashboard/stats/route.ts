import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [
      todayAppointments,
      weekAppointments,
      totalCustomers,
      totalServices,
      totalStaff,
      totalRevenue,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          businessId,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          businessId,
          startTime: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.customer.count({
        where: { businessId },
      }),
      prisma.service.count({
        where: { businessId, isActive: true },
      }),
      prisma.staff.count({
        where: { businessId, isActive: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          startTime: {
            gte: today,
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
        include: {
          customer: true,
          staff: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          service: true,
        },
        orderBy: {
          startTime: 'asc',
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      todayAppointments,
      weekAppointments,
      totalCustomers,
      totalServices,
      totalStaff,
      totalRevenue: totalRevenue._sum.amount || 0,
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
