import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const dayOffSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  reason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;

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

    const daysOff = await prisma.dayOff.findMany({
      where: { staffId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(daysOff);
  } catch (error) {
    console.error('Error fetching days off:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> }
) {
  try {
    const { businessId, staffId } = await params;
    const body = await request.json();

    const validation = dayOffSchema.safeParse(body);

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

    const { date, reason } = validation.data;

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const dayOff = await prisma.dayOff.create({
      data: {
        staffId,
        date: normalizedDate,
        reason,
      },
    });

    return NextResponse.json(dayOff, { status: 201 });
  } catch (error: any) {
    console.error('Error creating day off:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Day off already exists for this date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
