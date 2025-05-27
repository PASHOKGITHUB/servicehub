import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters long')
    .max(100, 'Service name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters long')
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim(),
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  price: z
    .number()
    .min(0, 'Price cannot be negative'),
  duration: z
    .number()
    .min(15, 'Duration must be at least 15 minutes'),
  serviceAreas: z
    .array(z.string().trim())
    .min(1, 'At least one service area is required'),
  tags: z
    .array(z.string().trim())
    .optional(),
});

export const updateServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters long')
    .max(100, 'Service name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters long')
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .optional(),
  duration: z
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .optional(),
  isActive: z
    .boolean()
    .optional(),
  serviceAreas: z
    .array(z.string().trim())
    .min(1, 'At least one service area is required')
    .optional(),
  tags: z
    .array(z.string().trim())
    .optional(),
});