import { Router } from 'express';
import {
  getUserDashboard,
  browseServices,
  getServiceDetails,
  createBooking,
  getUserBookings,
  cancelBooking,
  createReview,
  getUserReviews,
  updateReview,
  deleteReview,
} from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { isAuthenticated, isUser } from '../middlewares/auth';
import {
  createBookingSchema,
} from '../validators/booking.schema';
import {
  createReviewSchema,
  updateReviewSchema,
} from '../validators/review.schema';

const router: Router = Router();

// Public routes
router.get('/services', browseServices);
router.get('/services/:id', getServiceDetails);

// Protected user routes
router.use(isAuthenticated, isUser);

// Dashboard
router.get('/dashboard', getUserDashboard);

// Booking Management
router.post('/bookings', validate(createBookingSchema), createBooking);
router.get('/bookings', getUserBookings);
router.put('/bookings/:id/cancel', cancelBooking);

// Reviews
router.post('/reviews', validate(createReviewSchema), createReview);
router.get('/reviews', getUserReviews);
router.put('/reviews/:id', validate(updateReviewSchema), updateReview);
router.delete('/reviews/:id', deleteReview);

export default router;