import { z } from 'zod';
import { BookingStatus } from '../models/booking.model';
import { PaymentMethod } from '../models/payment.model';

export const createBookingSchema = z.object({
  service: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  bookingDate: z
    .string()
    .datetime('Invalid booking date format'),
  timeSlot: z
    .string()
    .min(1, 'Time slot is required')
    .trim(),
  address: z.object({
    street: z
      .string()
      .min(1, 'Street address is required')
      .trim(),
    city: z
      .string()
      .min(1, 'City is required')
      .trim(),
    state: z
      .string()
      .min(1, 'State is required')
      .trim(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Please provide a valid pincode'),
    landmark: z
      .string()
      .trim()
      .optional(),
  }),
  customerNotes: z
    .string()
    .max(500, 'Customer notes cannot exceed 500 characters')
    .optional(),
});

// Fixed: Export the missing schema
export const createBookingWithPaymentSchema = z.object({
  service: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  bookingDate: z
    .string()
    .datetime('Invalid booking date format'),
  timeSlot: z
    .string()
    .min(1, 'Time slot is required')
    .trim(),
  address: z.object({
    street: z
      .string()
      .min(1, 'Street address is required')
      .trim(),
    city: z
      .string()
      .min(1, 'City is required')
      .trim(),
    state: z
      .string()
      .min(1, 'State is required')
      .trim(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Please provide a valid pincode'),
    landmark: z
      .string()
      .trim()
      .optional(),
  }),
  customerNotes: z
    .string()
    .max(500, 'Customer notes cannot exceed 500 characters')
    .optional(),
  paymentMethod: z
    .enum(Object.values(PaymentMethod) as [string, ...string[]])
    .default(PaymentMethod.RAZORPAY),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(Object.values(BookingStatus) as [string, ...string[]]),
  providerNotes: z
    .string()
    .max(500, 'Provider notes cannot exceed 500 characters')
    .optional(),
  cancelReason: z
    .string()
    .max(200, 'Cancel reason cannot exceed 200 characters')
    .optional(),
});