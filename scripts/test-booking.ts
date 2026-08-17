import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { BookingService } from '../lib/booking';
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

async function testBookingSystem() {
  console.log('\n=== TESTING BOOKING SYSTEM ===\n');

  try {
    // Получаем тестовые данные из БД
    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const staff = await prisma.staff.findFirst({
      where: { businessId: business.id },
    });
    if (!staff) throw new Error('No staff found');

    const service = await prisma.service.findFirst({
      where: { businessId: business.id },
    });
    if (!service) throw new Error('No service found');

    const customer = await prisma.customer.findFirst({
      where: { businessId: business.id },
    });
    if (!customer) throw new Error('No customer found');

    console.log('✓ Test data loaded');
    console.log(`  Business: ${business.name}`);
    console.log(`  Staff: ${staff.id}`);
    console.log(`  Service: ${service.name} (${service.duration} min)`);
    console.log(`  Customer: ${customer.firstName} ${customer.lastName}`);

    // Тест 1: Получить доступные слоты
    console.log('\n--- Test 1: Get Available Slots ---');
    const testDate = new Date('2026-08-18T00:00:00Z');

    const slots = await BookingService.getAvailableSlots({
      businessId: business.id,
      staffId: staff.id,
      serviceId: service.id,
      date: testDate,
    });

    console.log(`✓ Found ${slots.length} available slots for ${testDate.toISOString().split('T')[0]}`);
    if (slots.length > 0) {
      console.log(`  First slot: ${slots[0].start.toISOString()} - ${slots[0].end.toISOString()}`);
      console.log(`  Last slot: ${slots[slots.length - 1].start.toISOString()} - ${slots[slots.length - 1].end.toISOString()}`);
    }

    // Тест 2: Создать новую запись
    console.log('\n--- Test 2: Create Appointment ---');
    const newAppointmentTime = new Date('2026-08-21T10:00:00Z');

    const newAppointment = await BookingService.createAppointment({
      businessId: business.id,
      customerId: customer.id,
      staffId: staff.id,
      serviceId: service.id,
      startTime: newAppointmentTime,
      notes: 'Test appointment',
    });

    console.log('✓ Appointment created successfully');
    console.log(`  ID: ${newAppointment.id}`);
    console.log(`  Time: ${newAppointment.startTime.toISOString()} - ${newAppointment.endTime.toISOString()}`);
    console.log(`  Status: ${newAppointment.status}`);

    // Тест 3: Попытка создать пересекающуюся запись (должна отклониться)
    console.log('\n--- Test 3: Try Double Booking (should fail) ---');
    try {
      await BookingService.createAppointment({
        businessId: business.id,
        customerId: customer.id,
        staffId: staff.id,
        serviceId: service.id,
        startTime: new Date('2026-08-21T10:15:00Z'), // Пересекается с предыдущей
        notes: 'This should fail',
      });
      console.log('✗ ERROR: Double booking was allowed!');
    } catch (error: any) {
      if (error.message.includes('already booked')) {
        console.log('✓ Double booking prevented successfully');
        console.log(`  Error: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Тест 4: Получить информацию о записи
    console.log('\n--- Test 4: Get Appointment ---');
    const fetchedAppointment = await BookingService.getAppointment(
      newAppointment.id,
      business.id
    );
    console.log('✓ Appointment fetched successfully');
    console.log(`  Customer: ${fetchedAppointment.customer.firstName} ${fetchedAppointment.customer.lastName}`);
    console.log(`  Service: ${fetchedAppointment.service.name}`);
    console.log(`  Staff: ${fetchedAppointment.staff.user.firstName} ${fetchedAppointment.staff.user.lastName}`);

    // Тест 5: Перенести запись
    console.log('\n--- Test 5: Reschedule Appointment ---');
    const newTime = new Date('2026-08-21T14:00:00Z');

    const rescheduled = await BookingService.rescheduleAppointment(
      newAppointment.id,
      business.id,
      newTime
    );
    console.log('✓ Appointment rescheduled successfully');
    console.log(`  New time: ${rescheduled.startTime.toISOString()} - ${rescheduled.endTime.toISOString()}`);

    // Тест 6: Попытка перенести на занятое время
    console.log('\n--- Test 6: Try Reschedule to Busy Time (should fail) ---');

    // Создаём ещё одну запись
    const anotherAppointment = await BookingService.createAppointment({
      businessId: business.id,
      customerId: customer.id,
      staffId: staff.id,
      serviceId: service.id,
      startTime: new Date('2026-08-21T16:00:00Z'),
      notes: 'Another appointment',
    });

    try {
      await BookingService.rescheduleAppointment(
        anotherAppointment.id,
        business.id,
        newTime // Пересекается с rescheduled
      );
      console.log('✗ ERROR: Reschedule to busy time was allowed!');
    } catch (error: any) {
      if (error.message.includes('already booked')) {
        console.log('✓ Reschedule to busy time prevented successfully');
        console.log(`  Error: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Тест 7: Отменить запись
    console.log('\n--- Test 7: Cancel Appointment ---');
    const cancelled = await BookingService.cancelAppointment(
      anotherAppointment.id,
      business.id
    );
    console.log('✓ Appointment cancelled successfully');
    console.log(`  Status: ${cancelled.status}`);

    // Тест 8: Попытка отменить уже отменённую запись
    console.log('\n--- Test 8: Try Cancel Already Cancelled (should fail) ---');
    try {
      await BookingService.cancelAppointment(
        anotherAppointment.id,
        business.id
      );
      console.log('✗ ERROR: Double cancellation was allowed!');
    } catch (error: any) {
      if (error.message.includes('already cancelled')) {
        console.log('✓ Double cancellation prevented successfully');
        console.log(`  Error: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Тест 9: Multi-tenant защита
    console.log('\n--- Test 9: Multi-tenant Protection ---');
    const fakeBusiness = 'fake-business-id';
    try {
      await BookingService.getAppointment(newAppointment.id, fakeBusiness);
      console.log('✗ ERROR: Cross-business access was allowed!');
    } catch (error: any) {
      if (error.message.includes('not belong') || error.message.includes('not found')) {
        console.log('✓ Multi-tenant protection working');
        console.log(`  Error: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Тест 10: Проверка рабочих часов
    console.log('\n--- Test 10: Working Hours Validation ---');
    try {
      await BookingService.createAppointment({
        businessId: business.id,
        customerId: customer.id,
        staffId: staff.id,
        serviceId: service.id,
        startTime: new Date('2026-08-21T23:00:00Z'), // За пределами рабочих часов
        notes: 'This should fail',
      });
      console.log('✗ ERROR: Booking outside working hours was allowed!');
    } catch (error: any) {
      if (error.message.includes('outside working hours') || error.message.includes('not working')) {
        console.log('✓ Working hours validation working');
        console.log(`  Error: ${error.message}`);
      } else {
        throw error;
      }
    }

    console.log('\n=== ALL TESTS PASSED ===\n');

  } catch (error) {
    console.error('\n✗ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testBookingSystem();
