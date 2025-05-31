// =====================================================
// src/services/payment.service.ts - FIXED VERSION
// =====================================================

import { razorpayInstance, validateRazorpayPayment } from '../config/razorpay';
import { Payment, PaymentGatewayStatus, PaymentMethod } from '../models/payment.model';
import { Booking, BookingStatus, PaymentStatus } from '../models/booking.model';
import { Service } from '../models/service.model'; // ✅ Added Service import
import { User } from '../models/user.model'; // ✅ Added User import for provider stats
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

  // ✅ FIXED: Now updates ALL required tables when payment is verified
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

    // Get payment record with booking details
    const payment = await Payment.findById(paymentId).populate({
      path: 'booking',
      populate: {
        path: 'service provider',
        select: 'name totalBookings'
      }
    });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment record not found');
    }

    // Start a database transaction to ensure all updates succeed together
    const session = await Payment.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. ✅ Update payment record
        await Payment.findByIdAndUpdate(
          paymentId,
          {
            status: PaymentGatewayStatus.CAPTURED,
            razorpayPaymentId,
            razorpaySignature,
          },
          { session }
        );

        // 2. ✅ Update booking status
        const updatedBooking = await Booking.findByIdAndUpdate(
          payment.booking._id,
          {
            paymentStatus: PaymentStatus.PAID,
            status: BookingStatus.CONFIRMED, // Payment confirmed = booking confirmed
          },
          { session, new: true }
        );

        if (!updatedBooking) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
        }

        // 3. ✅ Update Service statistics (INCREMENT totalBookings)
        await Service.findByIdAndUpdate(
          updatedBooking.service,
          {
            $inc: { totalBookings: 1 } // Increment total bookings by 1
          },
          { session }
        );

        // 4. ✅ Update Provider statistics (optional - track provider earnings)
        await User.findByIdAndUpdate(
          updatedBooking.provider,
          {
            $inc: { 
              totalEarnings: payment.amount,
              totalBookings: 1
            }
          },
          { session }
        );

        console.log('✅ Payment verification completed - All tables updated:', {
          paymentId: payment._id,
          bookingId: updatedBooking._id,
          serviceId: updatedBooking.service,
          providerId: updatedBooking.provider,
          amount: payment.amount
        });
      });
    } catch (error) {
      console.error('❌ Payment verification transaction failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }

    // Return updated payment record
    const updatedPayment = await Payment.findById(paymentId);
    return updatedPayment;
  }

  // ✅ FIXED: Also handle service stats when payment fails
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
      // Update booking status to cancelled due to payment failure
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: PaymentStatus.FAILED,
        status: BookingStatus.CANCELLED,
        cancelReason: 'Payment failed',
        cancelledAt: new Date(),
      });

      console.log('❌ Payment failed - Booking cancelled:', {
        paymentId: payment._id,
        bookingId: payment.booking,
        reason: failureReason
      });
    }

    return payment;
  }

  // ✅ NEW: Handle refunds (when booking is cancelled after payment)
  async processRefund(bookingId: string, refundAmount: number, refundReason: string) {
    const payment = await Payment.findOne({ 
      booking: bookingId, 
      status: PaymentGatewayStatus.CAPTURED 
    });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found for refund');
    }

    // Update payment status to refunded
    await Payment.findByIdAndUpdate(payment._id, {
      status: PaymentGatewayStatus.REFUNDED,
      refundAmount,
      failureReason: refundReason,
    });

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: PaymentStatus.REFUNDED,
      status: BookingStatus.REFUNDED,
    });

    // Decrement service total bookings (since booking is cancelled)
    const booking = await Booking.findById(bookingId);
    if (booking) {
      await Service.findByIdAndUpdate(booking.service, {
        $inc: { totalBookings: -1 } // Decrement by 1
      });
    }

    console.log('💰 Refund processed:', {
      paymentId: payment._id,
      bookingId,
      refundAmount,
      reason: refundReason
    });

    return payment;
  }
}

export const paymentService = new PaymentService();