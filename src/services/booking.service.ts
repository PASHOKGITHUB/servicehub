// src/services/booking.service.ts

import { Service } from '../models/service.model';
import { User } from '../models/user.model';
import { Booking, BookingStatus, PaymentStatus } from '../models/booking.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS } from '../constants';
import { Types } from 'mongoose';

export interface CreateBookingData {
  service: string;
  bookingDate: string;
  timeSlot: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  customerNotes?: string;
}

class BookingService {
  async createBooking(customerId: string, bookingData: CreateBookingData) {
    // Verify service exists and is active
    const service = await Service.findOne({ 
      _id: bookingData.service, 
      isActive: true 
    }).populate('provider', '_id name email phone');

    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found or not available');
    }

    // Verify customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');
    }

    // Calculate fees
    const serviceFee = service.price;
    const platformFee = Math.round(serviceFee * 0.1); // 10% platform fee
    const totalAmount = serviceFee + platformFee;

    // ✅ Create booking with ONLY ObjectId references (no population yet)
    const booking = await Booking.create({
      customer: customerId, // Just the string ID, Mongoose will convert to ObjectId
      provider: service.provider._id, // Extract ObjectId from populated provider
      service: service._id, // ObjectId reference
      bookingDate: new Date(bookingData.bookingDate),
      timeSlot: bookingData.timeSlot,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount,
      serviceFee,
      platformFee,
      address: bookingData.address,
      customerNotes: bookingData.customerNotes,
    });

    // ✅ Now populate for the response only
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate({
        path: 'service',
        select: 'name duration category price',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    return populatedBooking;
  }

  async getBookingById(bookingId: string) {
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate({
        path: 'service',
        select: 'name duration category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    return booking;
  }

  async getUserBookings(userId: string, query: any = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { customer: userId };

    if (status && status !== 'all') {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }

    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('provider', 'name email phone')
        .populate({
          path: 'service',
          select: 'name duration category',
          populate: {
            path: 'category',
            select: 'name'
          }
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  async cancelBooking(userId: string, bookingId: string, cancelReason?: string) {
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: userId,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });

    if (!booking) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND, 
        'Booking not found or cannot be cancelled'
      );
    }

    // Check if booking can be cancelled (at least 2 hours before)
    const bookingDateTime = new Date(booking.bookingDate);
    const now = new Date();
    const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot cancel booking less than 2 hours before the scheduled time'
      );
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason,
      },
      { new: true }
    ).populate([
      { path: 'provider', select: 'name email phone' },
      { path: 'service', select: 'name duration' }
    ]);

    return updatedBooking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    updates: any = {}
  ) {
    const updateData: any = { status };

    if (updates.providerNotes) {
      updateData.providerNotes = updates.providerNotes;
    }

    if (status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
      
      // Update service statistics
      const booking = await Booking.findById(bookingId);
      if (booking) {
        await Service.findByIdAndUpdate(booking.service, {
          $inc: { totalBookings: 1 },
        });
      }
    }

    if (status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      if (updates.cancelReason) {
        updateData.cancelReason = updates.cancelReason;
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    ).populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'provider', select: 'name email phone' },
      { path: 'service', select: 'name duration' }
    ]);

    if (!updatedBooking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    return updatedBooking;
  }
}

export const bookingService = new BookingService();