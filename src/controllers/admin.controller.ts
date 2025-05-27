import { Request, Response } from 'express';
import { adminService } from '../services/admin.services';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, stats, 'Dashboard statistics retrieved successfully')
  );
});

// User Management
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Users retrieved successfully')
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.getUserById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'User retrieved successfully')
  );
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, reason } = req.body;
  const user = await adminService.updateUserStatus(req.params.id, isActive, reason);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'User status updated successfully')
  );
});

// Provider Management
export const getAllProviders = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllProviders(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Providers retrieved successfully')
  );
});

// Service Category Management
export const createServiceCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminService.createServiceCategory(req.body);
  
  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, { category }, 'Service category created successfully')
  );
});

export const getAllServiceCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllServiceCategories(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Service categories retrieved successfully')
  );
});

export const updateServiceCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminService.updateServiceCategory(req.params.id, req.body);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { category }, 'Service category updated successfully')
  );
});

export const deleteServiceCategory = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteServiceCategory(req.params.id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {}, 'Service category deleted successfully')
  );
});

// Bookings Management
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllBookings(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Bookings retrieved successfully')
  );
});

// Financial Reports
export const getFinancialReports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await adminService.getFinancialReports(req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, reports, 'Financial reports retrieved successfully')
  );
});
