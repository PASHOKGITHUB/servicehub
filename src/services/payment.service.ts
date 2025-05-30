// src/services/payment.service.ts

import { razorpayInstance, validateRazorpayPayment } from '../config/razorpay';
import { Payment, PaymentGatewayStatus, PaymentMethod } from '../models/payment.model';
import { Booking, BookingStatus, PaymentStatus } from '../models/booking.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS } from '../constants';
import { Types } from 'mongoose';

class PaymentService {
  async createRazorpayOrder(bookingId: string | Types.ObjectId, amount: number) {
    try {
      // Convert ObjectId to string if needed
      const bookingIdStr = bookingId.toString();
      
      // Generate a shorter receipt ID (max 40 characters)
      const timestamp = Date.now().toString();
      const shortBookingId = bookingIdStr.slice(-8); // Last 8 characters of booking ID
      const receipt = `bk_${shortBookingId}_${timestamp.slice(-8)}`; // Format: bk_12345678_87654321
      
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: receipt, // Keep receipt under 40 characters
        payment_capture: 1,
      };

      console.log('Creating Razorpay order with receipt:', receipt, 'Length:', receipt.length);

      const order = await razorpayInstance.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Failed to create payment order');
    }
  }

  // ✅ Simplified - Accept only string IDs (ObjectId references)
  async createPaymentRecord(paymentData: {
    booking: string;      // ObjectId as string
    customer: string;     // ObjectId as string  
    provider: string;     // ObjectId as string
    amount: number;
    method: PaymentMethod;
    razorpayOrderId?: string;
  }) {
    console.log('Creating payment record with string IDs:', {
      booking: paymentData.booking,
      customer: paymentData.customer,
      provider: paymentData.provider,
      amount: paymentData.amount,
      method: paymentData.method
    });

    // Mongoose will automatically convert string IDs to ObjectIds
    const payment = await Payment.create({
      booking: paymentData.booking,        // String -> ObjectId
      customer: paymentData.customer,      // String -> ObjectId
      provider: paymentData.provider,      // String -> ObjectId
      amount: paymentData.amount,
      method: paymentData.method,
      razorpayOrderId: paymentData.razorpayOrderId,
    });
    
    console.log('Payment record created successfully:', {
      id: payment._id,
      booking: payment.booking,
      customer: payment.customer,
      provider: payment.provider
    });
    
    return payment;
  }

  async verifyRazorpayPayment(
    paymentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    // Validate signature
    const isValidSignature = validateRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid payment signature');
    }

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: PaymentGatewayStatus.CAPTURED,
        razorpayPaymentId,
        razorpaySignature,
      },
      { new: true }
    );

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment record not found');
    }

    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, {
      paymentStatus: PaymentStatus.PAID,
      status: BookingStatus.CONFIRMED,
    });

    return payment;
  }

  async handlePaymentFailure(paymentId: string, failureReason: string) {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: PaymentGatewayStatus.FAILED,
        failureReason,
      },
      { new: true }
    );

    if (payment) {
      // Update booking status
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: PaymentStatus.FAILED,
        status: BookingStatus.CANCELLED,
        cancelReason: 'Payment failed',
        cancelledAt: new Date(),
      });
    }

    return payment;
  }
}

export const paymentService = new PaymentService();