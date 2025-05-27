import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllProviders,
  createServiceCategory,
  getAllServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,
  getAllBookings,
  getFinancialReports,
} from '../controllers/admin.controller';
import { validate } from '../middlewares/validate';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  updateUserStatusSchema,
} from '../validators/admin.schema';

const router: Router = Router();

// Apply admin authentication to all routes
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);

// Provider Management
router.get('/providers', getAllProviders);

// Service Category Management
router.post('/categories', validate(createServiceCategorySchema), createServiceCategory);
router.get('/categories', getAllServiceCategories);
router.put('/categories/:id', validate(updateServiceCategorySchema), updateServiceCategory);
router.delete('/categories/:id', deleteServiceCategory);

// Bookings Management
router.get('/bookings', getAllBookings);

// Financial Reports
router.get('/reports/financial', getFinancialReports);

export default router;
