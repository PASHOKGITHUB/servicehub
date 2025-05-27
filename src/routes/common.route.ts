import { Router } from 'express';
import { ServiceCategory } from '../models/serviceCategory.model';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';

const router: Router = Router();

// Get all active service categories (public route)
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .select('name description icon slug')
    .lean();
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { categories }, 'Service categories retrieved successfully')
  );
}));

export default router;