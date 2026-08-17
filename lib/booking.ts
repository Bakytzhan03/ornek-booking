import { prisma } from './prisma';
import { AppointmentStatus } from '@prisma/client';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityParams {
  businessId: string;
  staffId: string;
  serviceId: string;
  date: Date;
}

export class BookingService {
  /**
   * Получить доступные временные слоты для записи
   */
  static async getAvailableSlots(params: AvailabilityParams): Promise<TimeSlot[]> {
    const { businessId, staffId, serviceId, date } = params;

    // Проверяем существование и принадлежность
    const [business, staff, service] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.staff.findFirst({
        where: { id: staffId, businessId, isActive: true },
        include: {
          workingHours: true,
          staffServices: {
            where: { serviceId },
          },
          daysOff: {
            where: {
              date: {
                gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
              },
            },
          },
        }
      }),
      prisma.service.findFirst({
        where: { id: serviceId, businessId, isActive: true }
      }),
    ]);

    if (!business) throw new Error('Business not found');
    if (!staff) throw new Error('Staff not found or not active');
    if (!service) throw new Error('Service not found or not active');

    // Check if staff provides this service
    if (staff.staffServices.length === 0) {
      throw new Error('Staff does not provide this service');
    }

    // Check if staff has a day off
    if (staff.daysOff.length > 0) {
      return []; // Staff has a day off on this date
    }

    // Определяем день недели
    const dayOfWeek = this.getDayOfWeek(date);

    // Получаем рабочие часы сотрудника на этот день
    const workingHours = staff.workingHours.find(
      wh => wh.dayOfWeek === dayOfWeek && wh.isActive
    );

    if (!workingHours) {
      return []; // Сотрудник не работает в этот день
    }

    // Получаем существующие записи на этот день
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Генерируем все возможные слоты
    const allSlots = this.generateTimeSlots(
      date,
      workingHours.startTime,
      workingHours.endTime,
      service.duration
    );

    // Фильтруем занятые слоты
    const availableSlots = allSlots.filter(slot => {
      return !existingAppointments.some(appointment => {
        return this.slotsOverlap(
          { start: slot.start, end: slot.end },
          { start: appointment.startTime, end: appointment.endTime }
        );
      });
    });

    return availableSlots;
  }

  /**
   * Создать бронирование с проверкой на double booking
   */
  static async createAppointment(data: {
    businessId: string;
    customerId: string;
    staffId: string;
    serviceId: string;
    startTime: Date;
    notes?: string;
  }) {
    const { businessId, customerId, staffId, serviceId, startTime, notes } = data;

    // Проверяем существование всех связанных сущностей
    const [business, customer, staff, service] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.customer.findFirst({ where: { id: customerId, businessId } }),
      prisma.staff.findFirst({
        where: { id: staffId, businessId, isActive: true },
        include: {
          workingHours: true,
          staffServices: {
            where: { serviceId },
          },
          daysOff: {
            where: {
              date: {
                gte: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()),
                lt: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 1),
              },
            },
          },
        }
      }),
      prisma.service.findFirst({
        where: { id: serviceId, businessId, isActive: true }
      }),
    ]);

    if (!business) throw new Error('Business not found');
    if (!customer) throw new Error('Customer not found or does not belong to this business');
    if (!staff) throw new Error('Staff not found or not active');
    if (!service) throw new Error('Service not found or not active');

    // Check if staff provides this service
    if (staff.staffServices.length === 0) {
      throw new Error('Staff does not provide this service');
    }

    // Check if staff has a day off
    if (staff.daysOff.length > 0) {
      throw new Error('Staff has a day off on this date');
    }

    // Вычисляем время окончания
    const endTime = new Date(startTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + service.duration);

    // Проверяем, что время находится в рабочих часах
    const dayOfWeek = this.getDayOfWeek(startTime);
    const workingHours = staff.workingHours.find(
      wh => wh.dayOfWeek === dayOfWeek && wh.isActive
    );

    if (!workingHours) {
      throw new Error('Staff is not working on this day');
    }

    const workStart = this.parseTime(startTime, workingHours.startTime);
    const workEnd = this.parseTime(startTime, workingHours.endTime);

    if (startTime < workStart || endTime > workEnd) {
      throw new Error('Appointment time is outside working hours');
    }

    // Проверяем на пересечение с существующими записями (double booking protection)
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            // Новая запись начинается во время существующей
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // Новая запись заканчивается во время существующей
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // Новая запись полностью охватывает существующую
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      throw new Error('This time slot is already booked');
    }

    // Создаём запись
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        customerId,
        staffId,
        serviceId,
        startTime,
        endTime,
        status: 'PENDING',
        notes,
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    return appointment;
  }

  /**
   * Получить бронирование по ID с проверкой принадлежности к бизнесу
   */
  static async getAppointment(appointmentId: string, businessId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId,
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        service: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found or does not belong to this business');
    }

    return appointment;
  }

  /**
   * Отменить бронирование
   */
  static async cancelAppointment(appointmentId: string, businessId: string) {
    const appointment = await this.getAppointment(appointmentId, businessId);

    if (appointment.status === 'CANCELLED') {
      throw new Error('Appointment is already cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed appointment');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    return updated;
  }

  /**
   * Перенести бронирование
   */
  static async rescheduleAppointment(
    appointmentId: string,
    businessId: string,
    newStartTime: Date
  ) {
    const appointment = await this.getAppointment(appointmentId, businessId);

    if (appointment.status === 'CANCELLED') {
      throw new Error('Cannot reschedule a cancelled appointment');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot reschedule a completed appointment');
    }

    // Проверяем доступность нового слота
    const service = await prisma.service.findUnique({
      where: { id: appointment.serviceId },
    });

    if (!service) throw new Error('Service not found');

    const newEndTime = new Date(newStartTime);
    newEndTime.setUTCMinutes(newEndTime.getUTCMinutes() + service.duration);

    // Проверяем рабочие часы
    const staff = await prisma.staff.findFirst({
      where: { id: appointment.staffId },
      include: { workingHours: true },
    });

    if (!staff) throw new Error('Staff not found');

    const dayOfWeek = this.getDayOfWeek(newStartTime);
    const workingHours = staff.workingHours.find(
      wh => wh.dayOfWeek === dayOfWeek && wh.isActive
    );

    if (!workingHours) {
      throw new Error('Staff is not working on this day');
    }

    const workStart = this.parseTime(newStartTime, workingHours.startTime);
    const workEnd = this.parseTime(newStartTime, workingHours.endTime);

    if (newStartTime < workStart || newEndTime > workEnd) {
      throw new Error('New appointment time is outside working hours');
    }

    // Проверяем на пересечение (исключая текущую запись)
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId: appointment.staffId,
        id: { not: appointmentId },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: newStartTime } },
              { endTime: { gt: newStartTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: newEndTime } },
              { endTime: { gte: newEndTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: newStartTime } },
              { endTime: { lte: newEndTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      throw new Error('This time slot is already booked');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    return updated;
  }

  // Вспомогательные методы

  private static getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getUTCDay()];
  }

  private static parseTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setUTCHours(hours, minutes, 0, 0);
    return result;
  }

  private static generateTimeSlots(
    date: Date,
    startTimeStr: string,
    endTimeStr: string,
    duration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = this.parseTime(date, startTimeStr);
    const endTime = this.parseTime(date, endTimeStr);

    let current = new Date(startTime);

    while (current < endTime) {
      const slotEnd = new Date(current);
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + duration);

      if (slotEnd <= endTime) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
        });
      }

      current.setUTCMinutes(current.getUTCMinutes() + 15); // Шаг 15 минут
    }

    return slots;
  }

  private static slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.start < slot2.end && slot1.end > slot2.start;
  }
}
