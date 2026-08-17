import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

const updateStaffServicesSchema = z.object({
  serviceIds: z.array(z.string()),
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
    const validation = updateStaffServicesSchema.safeParse(body);

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

    const { serviceIds } = validation.data;

    // Verify all services belong to this business
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        businessId,
      },
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'Invalid service IDs' },
        { status: 400 }
      );
    }

    // Update staff services in transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing staff services
      await tx.staffService.deleteMany({
        where: { staffId },
      });

      // Create new staff services
      if (serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map(serviceId => ({
            staffId,
            serviceId,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating staff services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
