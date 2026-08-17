import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ornek',
  user: 'postgres',
  password: 'postgres',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@barbershop.kz',
      phone: '+77001234567',
      password: hashedPassword,
      firstName: 'Асхат',
      lastName: 'Нурланов',
      role: 'BUSINESS_OWNER',
    },
  });

  const business = await prisma.business.create({
    data: {
      name: 'Barbershop Premium',
      slug: 'barbershop-premium-almaty',
      description: 'Современный барбершоп в центре Алматы',
      address: 'ул. Абая, 150',
      city: 'Алматы',
      country: 'Казахстан',
      timezone: 'Asia/Almaty',
      phone: '+77001234567',
      email: 'info@barbershop.kz',
      ownerId: owner.id,
    },
  });

  const staff1User = await prisma.user.create({
    data: {
      email: 'arman@barbershop.kz',
      phone: '+77001234568',
      password: hashedPassword,
      firstName: 'Арман',
      lastName: 'Токаев',
      role: 'STAFF',
    },
  });

  const staff2User = await prisma.user.create({
    data: {
      email: 'dauren@barbershop.kz',
      phone: '+77001234569',
      password: hashedPassword,
      firstName: 'Даурен',
      lastName: 'Смагулов',
      role: 'STAFF',
    },
  });

  const staff1 = await prisma.staff.create({
    data: {
      userId: staff1User.id,
      businessId: business.id,
      position: 'Старший барбер',
      description: '8 лет опыта',
      isActive: true,
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      userId: staff2User.id,
      businessId: business.id,
      position: 'Барбер',
      description: '3 года опыта',
      isActive: true,
    },
  });

  await prisma.workingHours.createMany({
    data: [
      { staffId: staff1.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' },
      { staffId: staff1.id, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00' },
      { staffId: staff1.id, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00' },
      { staffId: staff1.id, dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00' },
      { staffId: staff1.id, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00' },
      { staffId: staff1.id, dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00' },
      { staffId: staff2.id, dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '19:00' },
      { staffId: staff2.id, dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '19:00' },
      { staffId: staff2.id, dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '19:00' },
      { staffId: staff2.id, dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '19:00' },
      { staffId: staff2.id, dayOfWeek: 'FRIDAY', startTime: '10:00', endTime: '19:00' },
      { staffId: staff2.id, dayOfWeek: 'SUNDAY', startTime: '11:00', endTime: '17:00' },
    ],
  });

  const services = await prisma.service.createMany({
    data: [
      {
        businessId: business.id,
        name: 'Мужская стрижка',
        description: 'Классическая мужская стрижка',
        duration: 30,
        price: 5000,
      },
      {
        businessId: business.id,
        name: 'Стрижка + борода',
        description: 'Стрижка и оформление бороды',
        duration: 45,
        price: 7000,
      },
      {
        businessId: business.id,
        name: 'Бритьё головы',
        description: 'Бритьё головы опасной бритвой',
        duration: 20,
        price: 3000,
      },
      {
        businessId: business.id,
        name: 'Королевское бритьё',
        description: 'Классическое бритьё с горячим полотенцем',
        duration: 40,
        price: 6000,
      },
    ],
  });

  const allServices = await prisma.service.findMany({
    where: { businessId: business.id },
  });

  // Link staff to services
  await prisma.staffService.createMany({
    data: [
      // staff1 (Арман) provides all services
      { staffId: staff1.id, serviceId: allServices[0].id },
      { staffId: staff1.id, serviceId: allServices[1].id },
      { staffId: staff1.id, serviceId: allServices[2].id },
      { staffId: staff1.id, serviceId: allServices[3].id },
      // staff2 (Даурен) provides only first two services
      { staffId: staff2.id, serviceId: allServices[0].id },
      { staffId: staff2.id, serviceId: allServices[1].id },
    ],
  });

  const customers = await prisma.customer.createMany({
    data: [
      {
        businessId: business.id,
        firstName: 'Ержан',
        lastName: 'Касымов',
        phone: '+77771234567',
        email: 'erzhan@example.com',
      },
      {
        businessId: business.id,
        firstName: 'Нурлан',
        lastName: 'Абдуллаев',
        phone: '+77771234568',
        email: 'nurlan@example.com',
      },
      {
        businessId: business.id,
        firstName: 'Асылбек',
        lastName: 'Темиров',
        phone: '+77771234569',
      },
      {
        businessId: business.id,
        firstName: 'Бауыржан',
        lastName: 'Сарсенов',
        phone: '+77771234570',
        email: 'baur@example.com',
      },
    ],
  });

  const allCustomers = await prisma.customer.findMany({
    where: { businessId: business.id },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: allCustomers[0].id,
      staffId: staff1.id,
      serviceId: allServices[1].id,
      startTime: new Date('2026-08-18T10:00:00Z'),
      endTime: new Date('2026-08-18T10:45:00Z'),
      status: 'CONFIRMED',
      notes: 'Клиент просит короче по бокам',
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: allCustomers[1].id,
      staffId: staff2.id,
      serviceId: allServices[0].id,
      startTime: new Date('2026-08-18T14:00:00Z'),
      endTime: new Date('2026-08-18T14:30:00Z'),
      status: 'CONFIRMED',
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: allCustomers[2].id,
      staffId: staff1.id,
      serviceId: allServices[3].id,
      startTime: new Date('2026-08-19T11:00:00Z'),
      endTime: new Date('2026-08-19T11:40:00Z'),
      status: 'PENDING',
    },
  });

  const completedAppointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: allCustomers[3].id,
      staffId: staff1.id,
      serviceId: allServices[1].id,
      startTime: new Date('2026-08-14T15:00:00Z'),
      endTime: new Date('2026-08-14T15:45:00Z'),
      status: 'COMPLETED',
    },
  });

  await prisma.payment.create({
    data: {
      businessId: business.id,
      appointmentId: completedAppointment.id,
      amount: 7000,
      status: 'COMPLETED',
      paymentMethod: 'Наличные',
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
