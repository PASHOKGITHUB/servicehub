import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS } from '../constants';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message.join(', '));
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(HTTP_STATUS.NOT_FOUND, `Route ${req.originalUrl} not found`);
  next(error);
};