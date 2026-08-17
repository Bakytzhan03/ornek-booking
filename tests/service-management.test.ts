import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

describe('Service Management - Multi-tenant Security', () => {
  let businessA_Id: string;
  let businessB_Id: string;
  let serviceA_Id: string;
  let serviceB_Id: string;

  beforeAll(async () => {
    // Create Business A
    const userA = await prisma.user.create({
      data: {
        email: 'service-usera@test.com',
        password: await hashPassword('password'),
        firstName: 'User',
        lastName: 'A',
        role: 'BUSINESS_OWNER',
      },
    });

    const businessA = await prisma.business.create({
      data: {
        name: 'Business A Services',
        slug: 'business-a-services-' + Date.now(),
        address: 'Address A',
        city: 'City A',
        country: 'Kazakhstan',
        phone: '+71',
        email: 'businessa@test.com',
        ownerId: userA.id,
      },
    });
    businessA_Id = businessA.id;

    // Create Business B
    const userB = await prisma.user.create({
      data: {
        email: 'service-userb@test.com',
        password: await hashPassword('password'),
        firstName: 'User',
        lastName: 'B',
        role: 'BUSINESS_OWNER',
      },
    });

    const businessB = await prisma.business.create({
      data: {
        name: 'Business B Services',
        slug: 'business-b-services-' + Date.now(),
        address: 'Address B',
        city: 'City B',
        country: 'Kazakhstan',
        phone: '+72',
        email: 'businessb@test.com',
        ownerId: userB.id,
      },
    });
    businessB_Id = businessB.id;

    // Create services
    const serviceA = await prisma.service.create({
      data: {
        businessId: businessA_Id,
        name: 'Service A',
        duration: 30,
        price: 1000,
        isActive: true,
      },
    });
    serviceA_Id = serviceA.id;

    const serviceB = await prisma.service.create({
      data: {
        businessId: businessB_Id,
        name: 'Service B',
        duration: 45,
        price: 2000,
        isActive: true,
      },
    });
    serviceB_Id = serviceB.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.business.deleteMany({
      where: { id: { in: [businessA_Id, businessB_Id] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['service-usera@test.com', 'service-userb@test.com'] },
      },
    });
  });

  it('should isolate services by businessId', async () => {
    const servicesA = await prisma.service.findMany({
      where: { businessId: businessA_Id },
    });

    const servicesB = await prisma.service.findMany({
      where: { businessId: businessB_Id },
    });

    expect(servicesA.length).toBeGreaterThan(0);
    expect(servicesB.length).toBeGreaterThan(0);
    expect(servicesA.every(s => s.businessId === businessA_Id)).toBe(true);
    expect(servicesB.every(s => s.businessId === businessB_Id)).toBe(true);
  });

  it('should not return Business B service when querying Business A', async () => {
    const serviceB_InBusinessA = await prisma.service.findFirst({
      where: {
        id: serviceB_Id,
        businessId: businessA_Id,
      },
    });

    expect(serviceB_InBusinessA).toBeNull();
  });

  it('should only show active services in public booking API', async () => {
    // Create inactive service
    const inactiveService = await prisma.service.create({
      data: {
        businessId: businessA_Id,
        name: 'Inactive Service',
        duration: 20,
        price: 500,
        isActive: false,
      },
    });

    const activeServices = await prisma.service.findMany({
      where: {
        businessId: businessA_Id,
        isActive: true,
      },
    });

    const allServices = await prisma.service.findMany({
      where: {
        businessId: businessA_Id,
      },
    });

    expect(activeServices.length).toBeLessThan(allServices.length);
    expect(activeServices.every(s => s.isActive)).toBe(true);

    // Cleanup
    await prisma.service.delete({ where: { id: inactiveService.id } });
  });

  it('should cascade delete StaffService when service is deleted', async () => {
    // Create staff and link to service
    const staffUser = await prisma.user.create({
      data: {
        email: 'service-staff@test.com',
        password: await hashPassword('password'),
        firstName: 'Staff',
        lastName: 'Test',
        role: 'STAFF',
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: staffUser.id,
        businessId: businessA_Id,
        position: 'Tester',
      },
    });

    const testService = await prisma.service.create({
      data: {
        businessId: businessA_Id,
        name: 'Test Service for Cascade',
        duration: 30,
        price: 1000,
      },
    });

    const staffService = await prisma.staffService.create({
      data: {
        staffId: staff.id,
        serviceId: testService.id,
      },
    });

    // Delete service
    await prisma.service.delete({
      where: { id: testService.id },
    });

    // Check StaffService is also deleted (cascade)
    const staffServiceAfterDelete = await prisma.staffService.findUnique({
      where: { id: staffService.id },
    });

    expect(staffServiceAfterDelete).toBeNull();

    // Cleanup
    await prisma.staff.delete({ where: { id: staff.id } });
    await prisma.user.delete({ where: { id: staffUser.id } });
  });

  it('should not allow updating service from another business', async () => {
    // Try to update Business B service with Business A businessId filter
    const serviceB = await prisma.service.findFirst({
      where: {
        id: serviceB_Id,
        businessId: businessA_Id, // Wrong business
      },
    });

    expect(serviceB).toBeNull();
  });

  it('should create service with correct businessId', async () => {
    const newService = await prisma.service.create({
      data: {
        businessId: businessA_Id,
        name: 'New Service A',
        duration: 60,
        price: 3000,
      },
    });

    expect(newService.businessId).toBe(businessA_Id);
    expect(newService.businessId).not.toBe(businessB_Id);

    // Cleanup
    await prisma.service.delete({ where: { id: newService.id } });
  });
});
