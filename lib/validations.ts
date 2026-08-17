import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  country: z.string().min(2),
  timezone: z.string().default('Asia/Almaty'),
  phone: z.string().min(10),
  email: z.string().email(),
});

export const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  price: z.number().positive(),
});

export const createAppointmentSchema = z.object({
  customerId: z.string().cuid(),
  staffId: z.string().cuid(),
  serviceId: z.string().cuid(),
  startTime: z.date(),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export const workingHoursSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type CreateBusiness = z.infer<typeof createBusinessSchema>;
export type CreateService = z.infer<typeof createServiceSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type WorkingHours = z.infer<typeof workingHoursSchema>;
