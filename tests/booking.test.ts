import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BookingService } from '../lib/booking';
import { prisma } from '../lib/prisma';

describe('BookingService - Staff Service and Day Off', () => {
  let businessId: string;
  let staffId: string;
  let customerId: string;
  let serviceId: string;
  let otherServiceId: string;

  beforeAll(async () => {
    // Create owner user first
    const owner = await prisma.user.create({
      data: {
        email: 'owner@staff.com',
        password: 'hash',
        firstName: 'Test',
        lastName: 'Owner',
        role: 'BUSINESS_OWNER',
      },
    });

    // Create test business
    const business = await prisma.business.create({
      data: {
        name: 'Test Barbershop',
        slug: 'test-barbershop-staff',
        email: 'test@staff.com',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Almaty',
        country: 'Kazakhstan',
        timezone: 'Asia/Almaty',
        ownerId: owner.id,
      },
    });
    businessId = business.id;

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        email: 'staff@staff.com',
        password: 'hash',
        firstName: 'Test',
        lastName: 'Staff',
        role: 'STAFF',
      },
    });

    // Create staff
    const staff = await prisma.staff.create({
      data: {
        businessId,
        userId: staffUser.id,
        position: 'Barber',
        isActive: true,
      },
    });
    staffId = staff.id;

    // Create working hours for Monday
    await prisma.workingHours.create({
      data: {
        staffId,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    });

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        businessId,
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        phone: '+9876543210',
      },
    });
    customerId = customer.id;

    // Create service that staff provides
    const service = await prisma.service.create({
      data: {
        businessId,
        name: 'Haircut',
        duration: 30,
        price: 25.0,
        isActive: true,
      },
    });
    serviceId = service.id;

    // Create another service that staff does NOT provide
    const otherService = await prisma.service.create({
      data: {
        businessId,
        name: 'Massage',
        duration: 60,
        price: 50.0,
        isActive: true,
      },
    });
    otherServiceId = otherService.id;

    // Link staff to haircut service only
    await prisma.staffService.create({
      data: {
        staffId,
        serviceId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup - business delete will CASCADE to related records
    await prisma.business.deleteMany({ where: { id: businessId } });
    await prisma.user.deleteMany({
      where: { email: { in: ['owner@staff.com', 'staff@staff.com'] } },
    });
  });

  it('should reject booking when staff does not provide the service', async () => {
    // Get next Monday
    const nextMonday = getNextMonday();

    await expect(
      BookingService.getAvailableSlots({
        businessId,
        staffId,
        serviceId: otherServiceId, // Staff does NOT provide massage
        date: nextMonday,
      })
    ).rejects.toThrow('Staff does not provide this service');
  });

  it('should reject appointment when staff does not provide the service', async () => {
    const nextMonday = getNextMonday();
    const startTime = new Date(nextMonday);
    startTime.setUTCHours(10, 0, 0, 0);

    await expect(
      BookingService.createAppointment({
        businessId,
        customerId,
        staffId,
        serviceId: otherServiceId, // Staff does NOT provide massage
        startTime,
      })
    ).rejects.toThrow('Staff does not provide this service');
  });

  it('should return empty slots when staff has a day off', async () => {
    const nextMonday = getNextMonday();

    // Create day off for next Monday
    await prisma.dayOff.create({
      data: {
        staffId,
        date: nextMonday,
        reason: 'Testing day off',
      },
    });

    const slots = await BookingService.getAvailableSlots({
      businessId,
      staffId,
      serviceId, // Staff provides this service
      date: nextMonday,
    });

    expect(slots).toEqual([]);

    // Cleanup
    await prisma.dayOff.deleteMany({
      where: { staffId, date: nextMonday },
    });
  });

  it('should reject appointment when staff has a day off', async () => {
    const nextMonday = getNextMonday();
    const startTime = new Date(nextMonday);
    startTime.setUTCHours(10, 0, 0, 0);

    // Create day off for next Monday
    await prisma.dayOff.create({
      data: {
        staffId,
        date: nextMonday,
        reason: 'Testing day off',
      },
    });

    await expect(
      BookingService.createAppointment({
        businessId,
        customerId,
        staffId,
        serviceId, // Staff provides this service
        startTime,
      })
    ).rejects.toThrow('Staff has a day off on this date');

    // Cleanup
    await prisma.dayOff.deleteMany({
      where: { staffId, date: nextMonday },
    });
  });

  it('should return available slots on normal working day when staff provides service', async () => {
    const nextMonday = getNextMonday();

    const slots = await BookingService.getAvailableSlots({
      businessId,
      staffId,
      serviceId, // Staff provides this service
      date: nextMonday,
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start).toBeDefined();
    expect(slots[0].end).toBeDefined();
  });

  it('should create appointment successfully on normal working day', async () => {
    const nextMonday = getNextMonday();
    const startTime = new Date(nextMonday);
    startTime.setUTCHours(10, 0, 0, 0);

    const appointment = await BookingService.createAppointment({
      businessId,
      customerId,
      staffId,
      serviceId,
      startTime,
      notes: 'Test appointment',
    });

    expect(appointment).toBeDefined();
    expect(appointment.staffId).toBe(staffId);
    expect(appointment.serviceId).toBe(serviceId);
    expect(appointment.status).toBe('PENDING');

    // Cleanup
    await prisma.appointment.delete({ where: { id: appointment.id } });
  });

  it('should prevent double booking', async () => {
    const nextMonday = getNextMonday();
    const startTime = new Date(nextMonday);
    startTime.setUTCHours(11, 0, 0, 0);

    // Create first appointment
    const firstAppointment = await BookingService.createAppointment({
      businessId,
      customerId,
      staffId,
      serviceId,
      startTime,
    });

    // Try to create overlapping appointment
    await expect(
      BookingService.createAppointment({
        businessId,
        customerId,
        staffId,
        serviceId,
        startTime, // Same time
      })
    ).rejects.toThrow('This time slot is already booked');

    // Cleanup
    await prisma.appointment.delete({ where: { id: firstAppointment.id } });
  });
});

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday;
}
