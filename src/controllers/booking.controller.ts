// src/controllers/booking.controller.ts

import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants';
import { PaymentMethod } from '../models/payment.model';

export const createBookingWithPayment = asyncHandler(async (req: Request, res: Response) => {
  const { paymentMethod, ...bookingData } = req.body;
  
  console.log('Creating booking with data:', { paymentMethod, bookingData });
  
  // Create booking (returns populated booking for response)
  const booking = await bookingService.createBooking(req.user._id, bookingData);
  
  if (!booking) {
    console.error('Booking creation failed: booking is null');
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      new ApiResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        null,
        'Booking creation failed'
      )
    );
  }
  console.log('Booking created successfully:', {
    id: booking._id,
    customer: booking.customer._id,  // Extract ObjectId from populated object
    provider: booking.provider._id,   // Extract ObjectId from populated object
    service: booking.service._id      // Extract ObjectId from populated object
  });
  
  let paymentOrder = null;
  let payment = null;

  if (paymentMethod === PaymentMethod.RAZORPAY) {
    // Create Razorpay order
    paymentOrder = await paymentService.createRazorpayOrder(
      booking._id,
      booking.totalAmount
    );

    console.log('Razorpay order created:', paymentOrder);

    // ✅ Create payment record with string IDs only
    payment = await paymentService.createPaymentRecord({
      booking: booking._id.toString(),           // Convert ObjectId to string
      customer: booking.customer._id.toString(), // Extract _id from populated customer
      provider: booking.provider._id.toString(), // Extract _id from populated provider
      amount: booking.totalAmount,
      method: PaymentMethod.RAZORPAY,
      razorpayOrderId: paymentOrder.id,
    });

    console.log('Payment record created successfully:', payment);
  }

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        booking,
        payment,
        razorpayOrder: paymentOrder,
      },
      'Booking created successfully'
    )
  );
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const {
    paymentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const payment = await paymentService.verifyRazorpayPayment(
    paymentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { payment }, 'Payment verified successfully')
  );
});

export const handlePaymentFailure = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, reason } = req.body;

  const payment = await paymentService.handlePaymentFailure(paymentId, reason);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { payment }, 'Payment failure handled')
  );
});

// Additional booking controllers
export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.getUserBookings(req.user._id, req.query);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Bookings retrieved successfully')
  );
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { cancelReason } = req.body;
  const booking = await bookingService.cancelBooking(req.user._id, req.params.id, cancelReason);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { booking }, 'Booking cancelled successfully')
  );
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id);
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { booking }, 'Booking retrieved successfully')
  );
});