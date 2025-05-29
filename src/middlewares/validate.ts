import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        throw new ApiError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY, 
          'Validation error', 
          errors
        );
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ApiError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.VALIDATION_ERROR,
          errors
        );
      }

      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate URL parameters
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ApiError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.VALIDATION_ERROR,
          errors
        );
      }

      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};