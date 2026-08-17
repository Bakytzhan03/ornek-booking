import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const servicesSchema = z.object({
  serviceIds: z.array(z.string().cuid()),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;
    const body = await request.json();

    const validation = servicesSchema.safeParse(body);

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

    // Delete existing service assignments
    await prisma.staffService.deleteMany({
      where: { staffId },
    });

    // Create new service assignments
    if (validation.data.serviceIds.length > 0) {
      await prisma.staffService.createMany({
        data: validation.data.serviceIds.map(serviceId => ({
          staffId,
          serviceId,
        })),
      });
    }

    // Fetch updated staff with services
    const updated = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        staffServices: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating staff services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
