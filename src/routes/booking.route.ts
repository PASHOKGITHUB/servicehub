import { Router } from 'express';
import {
  createBookingWithPayment,
  verifyPayment,
  handlePaymentFailure,
  getUserBookings,
  cancelBooking,
  getBookingById,
} from '../controllers/booking.controller';
import { validate } from '../middlewares/validate';
import { isAuthenticated, isUser } from '../middlewares/auth';
import { createBookingWithPaymentSchema } from '../validators/booking.schema';

const router: Router = Router();

router.use(isAuthenticated);

// Booking with payment routes
router.post('/', isUser, validate(createBookingWithPaymentSchema), createBookingWithPayment);
router.post('/verify-payment', isUser, verifyPayment);
router.post('/payment-failure', isUser, handlePaymentFailure);

// Booking management routes
router.get('/', isUser, getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', isUser, cancelBooking);

export default router;