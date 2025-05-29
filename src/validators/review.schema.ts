import { z } from 'zod';

export const createReviewSchema = z.object({
  booking: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters long')
    .max(500, 'Comment cannot exceed 500 characters')
    .optional(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .optional(),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters long')
    .max(500, 'Comment cannot exceed 500 characters')
    .optional(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .optional(),
});