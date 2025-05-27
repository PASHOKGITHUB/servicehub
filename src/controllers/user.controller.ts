import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getUserDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await userService.getUserDashboard(req.user._id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, dashboard, 'User dashboard retrieved successfully')
  );
});

// Service Browsing
export const browseServices = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.browseServices(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Services retrieved successfully')
  );
});

export const getServiceDetails = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getServiceDetails(req.params.id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Service details retrieved successfully')
  );
});

// Booking Management
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await userService.createBooking(req.user._id, req.body);
  
  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, { booking }, 'Booking created successfully')
  );
});

export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserBookings(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Bookings retrieved successfully')
  );
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { cancelReason } = req.body;
  const booking = await userService.cancelBooking(req.user._id, req.params.id, cancelReason);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { booking }, 'Booking cancelled successfully')
  );
});

// Reviews
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await userService.createReview(req.user._id, req.body);
  
  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, { review }, 'Review created successfully')
  );
});

export const getUserReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserReviews(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Reviews retrieved successfully')
  );
});
