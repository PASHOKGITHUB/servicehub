import { Request, Response } from 'express';
import { providerService } from '../services/provider.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getProviderDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await providerService.getProviderDashboard(req.user._id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, dashboard, 'Provider dashboard retrieved successfully')
  );
});

// Service Management
export const createService = asyncHandler(async (req: Request, res: Response) => {
  const service = await providerService.createService(req.user._id, req.body);
  
  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, { service }, 'Service created successfully')
  );
});

export const getProviderServices = asyncHandler(async (req: Request, res: Response) => {
  const result = await providerService.getProviderServices(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Services retrieved successfully')
  );
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const service = await providerService.updateService(req.user._id, req.params.id, req.body);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { service }, 'Service updated successfully')
  );
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  await providerService.deleteService(req.user._id, req.params.id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {}, 'Service deleted successfully')
  );
});

// Booking Management
export const getProviderBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await providerService.getProviderBookings(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Bookings retrieved successfully')
  );
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, providerNotes, cancelReason } = req.body;
  const booking = await providerService.updateBookingStatus(
    req.user._id,
    req.params.id,
    status,
    { providerNotes, cancelReason }
  );
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { booking }, 'Booking status updated successfully')
  );
});

// Reviews Management
export const getProviderReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await providerService.getProviderReviews(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Reviews retrieved successfully')
  );
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const { reply } = req.body;
  const review = await providerService.replyToReview(req.user._id, req.params.id, reply);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { review }, 'Review reply added successfully')
  );
});
