// src/routes/user.route.ts
import { Router } from 'express';
import { isAuthenticated, isAdmin,isUser } from '../middlewares/auth';
import {
  getUserDashboard,
  browseServices,
  getServiceDetails,
  createBooking,
  getUserBookings,
  cancelBooking,
  createReview,
  getUserReviews,
} from '../controllers/user.controller';

import { validate } from '../middlewares/validate';
import {
  createBookingSchema,
} from '../validators/booking.schema';


const router: Router = Router();

// Placeholder routes - will be implemented later
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

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
router.post('/reviews', createReview);
router.get('/reviews', getUserReviews);


export default router;