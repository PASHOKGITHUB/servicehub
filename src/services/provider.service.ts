import { Service, IService } from '../models/service.model';
import { ServiceCategory } from '../models/serviceCategory.model';
import { Booking, BookingStatus } from '../models/booking.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

class ProviderService {
  // Dashboard Statistics
  async getProviderDashboard(providerId: string) {
    const [
      totalServices,
      activeServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalEarnings,
      monthlyEarnings,
      averageRating,
      totalReviews,
      recentBookings,
    ] = await Promise.all([
      Service.countDocuments({ provider: providerId }),
      Service.countDocuments({ provider: providerId, isActive: true }),
      Booking.countDocuments({ provider: providerId }),
      Booking.countDocuments({ provider: providerId, status: BookingStatus.PENDING }),
      Booking.countDocuments({ provider: providerId, status: BookingStatus.COMPLETED }),
      Booking.aggregate([
        { $match: { provider: providerId, status: BookingStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$serviceFee' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            provider: providerId,
            status: BookingStatus.COMPLETED,
            completedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$serviceFee' } } },
      ]),
      Review.aggregate([
        { $match: { provider: providerId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
      Review.countDocuments({ provider: providerId }),
      Booking.find({ provider: providerId })
        .populate('customer', 'name email phone')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      services: {
        total: totalServices,
        active: activeServices,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        completed: completedBookings,
      },
      earnings: {
        total: totalEarnings[0]?.total || 0,
        monthly: monthlyEarnings[0]?.total || 0,
      },
      rating: {
        average: averageRating[0]?.avgRating || 0,
        totalReviews,
      },
      recentBookings,
    };
  }

  // Service Management
  async createService(providerId: string, serviceData: any): Promise<IService> {
    // Verify category exists
    const category = await ServiceCategory.findById(serviceData.category);
    if (!category || !category.isActive) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid service category');
    }

    const service = await Service.create({
      ...serviceData,
      provider: providerId,
    });

    await service.populate('category', 'name');
    return service;
  }

  async getProviderServices(providerId: string, query: any = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { provider: providerId };

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Service.countDocuments(filter),
    ]);

    return {
      services,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  async updateService(providerId: string, serviceId: string, updateData: any): Promise<IService> {
    const service = await Service.findOneAndUpdate(
      { _id: serviceId, provider: providerId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found');
    }

    return service;
  }

  async deleteService(providerId: string, serviceId: string): Promise<void> {
    const service = await Service.findOne({ _id: serviceId, provider: providerId });
    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found');
    }

    // Check if service has active bookings
    const activeBookings = await Booking.countDocuments({
      service: serviceId,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    });

    if (activeBookings > 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot delete service with active bookings'
      );
    }

    await Service.findByIdAndDelete(serviceId);
  }

  // Booking Management
  async getProviderBookings(providerId: string, query: any = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { provider: providerId };

    if (status && status !== 'all') {
      filter.status = status;
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
        .populate('customer', 'name email phone')
        .populate('service', 'name duration')
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

  async updateBookingStatus(
    providerId: string,
    bookingId: string,
    status: BookingStatus,
    updates: any = {}
  ) {
    const booking = await Booking.findOne({ _id: bookingId, provider: providerId });
    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    const updateData: any = { status };

    if (updates.providerNotes) {
      updateData.providerNotes = updates.providerNotes;
    }

    if (status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
      // Update service statistics
      await Service.findByIdAndUpdate(booking.service, {
        $inc: { totalBookings: 1 },
      });
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
    ).populate('customer', 'name email phone').populate('service', 'name');

    return updatedBooking;
  }

  // Reviews Management
  async getProviderReviews(providerId: string, query: any = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { provider: providerId, isVisible: true };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customer', 'name')
        .populate('service', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  async replyToReview(providerId: string, reviewId: string, reply: string) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, provider: providerId },
      {
        providerReply: reply,
        providerReplyAt: new Date(),
      },
      { new: true }
    ).populate('customer', 'name').populate('service', 'name');

    if (!review) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Review not found');
    }

    return review;
  }
}

export const providerService = new ProviderService();
