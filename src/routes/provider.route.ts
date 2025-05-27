import { Router } from 'express';
import {
  getProviderDashboard,
  createService,
  getProviderServices,
  updateService,
  deleteService,
  getProviderBookings,
  updateBookingStatus,
  getProviderReviews,
  replyToReview,
} from '../controllers/provider.controller';
import { validate } from '../middlewares/validate';
import { isAuthenticated, isProvider } from '../middlewares/auth';
import {
  createServiceSchema,
  updateServiceSchema,
} from '../validators/service.schema';
import {
  updateBookingStatusSchema,
} from '../validators/booking.schema';

const router: Router = Router();

// Apply provider authentication to all routes
router.use(isAuthenticated, isProvider);

// Dashboard
router.get('/dashboard', getProviderDashboard);

// Service Management
router.post('/services', validate(createServiceSchema), createService);
router.get('/services', getProviderServices);
router.put('/services/:id', validate(updateServiceSchema), updateService);
router.delete('/services/:id', deleteService);

// Booking Management
router.get('/bookings', getProviderBookings);
router.put('/bookings/:id/status', validate(updateBookingStatusSchema), updateBookingStatus);

// Reviews Management
router.get('/reviews', getProviderReviews);
router.put('/reviews/:id/reply', replyToReview);

export default router;