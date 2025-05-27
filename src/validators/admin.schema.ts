import { z } from 'zod';

export const createServiceCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters long')
    .max(50, 'Category name cannot exceed 50 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(200, 'Description cannot exceed 200 characters')
    .trim(),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .trim(),
  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be a non-negative integer')
    .optional(),
});

export const updateServiceCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters long')
    .max(50, 'Category name cannot exceed 50 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(200, 'Description cannot exceed 200 characters')
    .trim()
    .optional(),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .trim()
    .optional(),
  isActive: z
    .boolean()
    .optional(),
  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be a non-negative integer')
    .optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z
    .string()
    .min(1, 'Reason is required when changing user status')
    .optional(),
});