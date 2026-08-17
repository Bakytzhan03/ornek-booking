import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string; dayOffId: string }> }
) {
  try {
    const auth = await requireAuth();
    const businessId = auth.businessId;
    const { staffId, dayOffId } = await params;

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

    // Verify day off belongs to this staff
    const dayOff = await prisma.dayOff.findFirst({
      where: {
        id: dayOffId,
        staffId,
      },
    });

    if (!dayOff) {
      return NextResponse.json(
        { error: 'Day off not found' },
        { status: 404 }
      );
    }

    await prisma.dayOff.delete({
      where: { id: dayOffId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting day off:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
