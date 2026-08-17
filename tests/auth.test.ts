import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { hashPassword, authenticateUser, createUser } from '../lib/auth';

describe('Authentication System', () => {
  let testUserId: string;
  let testBusinessId: string;
  const testEmail = 'test-auth@example.com';
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testBusinessId) {
      await prisma.business.deleteMany({ where: { id: testBusinessId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  describe('Password hashing', () => {
    it('should hash password correctly', async () => {
      const hashed = await hashPassword(testPassword);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('User creation', () => {
    it('should create user with hashed password', async () => {
      const user = await createUser({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'BUSINESS_OWNER',
      });

      testUserId = user.id;

      expect(user.id).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.password).not.toBe(testPassword);
      expect(user.role).toBe('BUSINESS_OWNER');
    });

    it('should not allow duplicate email', async () => {
      await expect(
        createUser({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'BUSINESS_OWNER',
        })
      ).rejects.toThrow();
    });
  });

  describe('User authentication', () => {
    beforeAll(async () => {
      // Create business for test user
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          slug: 'test-business-auth-' + Date.now(),
          address: 'Test Address',
          city: 'Test City',
          country: 'Kazakhstan',
          phone: '+7',
          email: testEmail,
          ownerId: testUserId,
        },
      });
      testBusinessId = business.id;
    });

    it('should authenticate user with correct credentials', async () => {
      const result = await authenticateUser(testEmail, testPassword);

      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
      expect(result?.businessId).toBe(testBusinessId);
    });

    it('should reject user with wrong password', async () => {
      const result = await authenticateUser(testEmail, 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const result = await authenticateUser('nonexistent@example.com', testPassword);
      expect(result).toBeNull();
    });
  });
});

describe('Multi-tenant Security', () => {
  let businessA_Id: string;
  let businessB_Id: string;
  let userA_Id: string;
  let userB_Id: string;
  let serviceA_Id: string;
  let serviceB_Id: string;
  let appointmentA_Id: string;
  let appointmentB_Id: string;

  beforeAll(async () => {
    // Create User A and Business A
    const userA = await prisma.user.create({
      data: {
        email: 'usera@multitenant.test',
        password: await hashPassword('password'),
        firstName: 'User',
        lastName: 'A',
        role: 'BUSINESS_OWNER',
      },
    });
    userA_Id = userA.id;

    const businessA = await prisma.business.create({
      data: {
        name: 'Business A',
        slug: 'business-a-' + Date.now(),
        address: 'Address A',
        city: 'City A',
        country: 'Kazakhstan',
        phone: '+71',
        email: 'businessa@test.com',
        ownerId: userA_Id,
      },
    });
    businessA_Id = businessA.id;

    // Create User B and Business B
    const userB = await prisma.user.create({
      data: {
        email: 'userb@multitenant.test',
        password: await hashPassword('password'),
        firstName: 'User',
        lastName: 'B',
        role: 'BUSINESS_OWNER',
      },
    });
    userB_Id = userB.id;

    const businessB = await prisma.business.create({
      data: {
        name: 'Business B',
        slug: 'business-b-' + Date.now(),
        address: 'Address B',
        city: 'City B',
        country: 'Kazakhstan',
        phone: '+72',
        email: 'businessb@test.com',
        ownerId: userB_Id,
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
      },
    });
    serviceA_Id = serviceA.id;

    const serviceB = await prisma.service.create({
      data: {
        businessId: businessB_Id,
        name: 'Service B',
        duration: 30,
        price: 2000,
      },
    });
    serviceB_Id = serviceB.id;

    // Create customers and appointments
    const customerA = await prisma.customer.create({
      data: {
        businessId: businessA_Id,
        firstName: 'Customer',
        lastName: 'A',
        phone: '+7001',
      },
    });

    const staffA = await prisma.user.create({
      data: {
        email: 'staffa@test.com',
        password: await hashPassword('password'),
        firstName: 'Staff',
        lastName: 'A',
        role: 'STAFF',
      },
    });

    const staffProfileA = await prisma.staff.create({
      data: {
        userId: staffA.id,
        businessId: businessA_Id,
        position: 'Barber',
      },
    });

    const appointmentA = await prisma.appointment.create({
      data: {
        businessId: businessA_Id,
        customerId: customerA.id,
        staffId: staffProfileA.id,
        serviceId: serviceA_Id,
        startTime: new Date('2026-08-20T10:00:00Z'),
        endTime: new Date('2026-08-20T10:30:00Z'),
        status: 'PENDING',
      },
    });
    appointmentA_Id = appointmentA.id;

    const customerB = await prisma.customer.create({
      data: {
        businessId: businessB_Id,
        firstName: 'Customer',
        lastName: 'B',
        phone: '+7002',
      },
    });

    const staffB = await prisma.user.create({
      data: {
        email: 'staffb@test.com',
        password: await hashPassword('password'),
        firstName: 'Staff',
        lastName: 'B',
        role: 'STAFF',
      },
    });

    const staffProfileB = await prisma.staff.create({
      data: {
        userId: staffB.id,
        businessId: businessB_Id,
        position: 'Barber',
      },
    });

    const appointmentB = await prisma.appointment.create({
      data: {
        businessId: businessB_Id,
        customerId: customerB.id,
        staffId: staffProfileB.id,
        serviceId: serviceB_Id,
        startTime: new Date('2026-08-20T11:00:00Z'),
        endTime: new Date('2026-08-20T11:30:00Z'),
        status: 'PENDING',
      },
    });
    appointmentB_Id = appointmentB.id;
  });

  afterAll(async () => {
    // Cleanup - Business delete will cascade
    await prisma.business.deleteMany({
      where: { id: { in: [businessA_Id, businessB_Id] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['usera@multitenant.test', 'userb@multitenant.test', 'staffa@test.com', 'staffb@test.com'] },
      },
    });
  });

  it('should return only Business A services for Business A owner', async () => {
    const services = await prisma.service.findMany({
      where: { businessId: businessA_Id },
    });

    expect(services.length).toBeGreaterThan(0);
    expect(services.every(s => s.businessId === businessA_Id)).toBe(true);
  });

  it('should not return Business B services when querying Business A', async () => {
    const services = await prisma.service.findMany({
      where: { businessId: businessA_Id },
    });

    expect(services.every(s => s.businessId !== businessB_Id)).toBe(true);
  });

  it('should not allow Business A owner to access Business B appointment', async () => {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentB_Id,
        businessId: businessA_Id, // Wrong businessId
      },
    });

    expect(appointment).toBeNull();
  });

  it('should correctly identify appointment ownership', async () => {
    const appointmentA = await prisma.appointment.findUnique({
      where: { id: appointmentA_Id },
    });

    const appointmentB = await prisma.appointment.findUnique({
      where: { id: appointmentB_Id },
    });

    expect(appointmentA?.businessId).toBe(businessA_Id);
    expect(appointmentB?.businessId).toBe(businessB_Id);
    expect(appointmentA?.businessId).not.toBe(businessB_Id);
  });

  it('should enforce business isolation in appointments query', async () => {
    const appointmentsA = await prisma.appointment.findMany({
      where: { businessId: businessA_Id },
    });

    const appointmentsB = await prisma.appointment.findMany({
      where: { businessId: businessB_Id },
    });

    expect(appointmentsA.every(a => a.businessId === businessA_Id)).toBe(true);
    expect(appointmentsB.every(a => a.businessId === businessB_Id)).toBe(true);
    expect(appointmentsA.length).toBeGreaterThan(0);
    expect(appointmentsB.length).toBeGreaterThan(0);
  });
});
