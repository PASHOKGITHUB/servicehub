import { Service } from '../models/service.model';
import { ServiceCategory } from '../models/serviceCategory.model';
import { Booking, BookingStatus } from '../models/booking.model';
import { Review } from '../models/review.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS } from '../constants';

class UserService {
  // Dashboard
  async getUserDashboard(userId: string) {
    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalSpent,
      recentBookings,
      favoriteCategories,
    ] = await Promise.all([
      Booking.countDocuments({ customer: userId }),
      Booking.countDocuments({
        customer: userId,
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        bookingDate: { $gte: new Date() },
      }),
      Booking.countDocuments({ customer: userId, status: BookingStatus.COMPLETED }),
      Booking.aggregate([
        { $match: { customer: userId, status: BookingStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.find({ customer: userId })
        .populate('provider', 'name')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Booking.aggregate([
        { $match: { customer: userId } },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceData',
          },
        },
        { $unwind: '$serviceData' },
        {
          $group: {
            _id: '$serviceData.category',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'servicecategories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryData',
          },
        },
        { $unwind: '$categoryData' },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]),
    ]);

    return {
      bookings: {
        total: totalBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
      },
      spending: {
        total: totalSpent[0]?.total || 0,
      },
      recentBookings,
      favoriteCategories,
    };
  }

  // Browse Services
  async browseServices(query: any = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      city,
      rating,
      sortBy = 'averageRating',
      sortOrder = 'desc',
    } = query;

    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (city) {
      filter.serviceAreas = { $in: [new RegExp(city, 'i')] };
    }

    if (rating) {
      filter.averageRating = { $gte: parseFloat(rating) };
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

    const [services, total, categories] = await Promise.all([
      Service.find(filter)
        .populate('category', 'name')
        .populate('provider', 'name averageRating totalReviews')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Service.countDocuments(filter),
      ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    return {
      services,
      categories,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  // Service Details
  async getServiceDetails(serviceId: string) {
    const [service, reviews] = await Promise.all([
      Service.findOne({ _id: serviceId, isActive: true })
        .populate('category', 'name')
        .populate('provider', 'name email phone averageRating totalReviews')
        .lean(),
      Review.find({ service: serviceId, isVisible: true })
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found');
    }

    return {
      service,
      reviews,
    };
  }

  // Booking Management
  async createBooking(userId: string, bookingData: any) {
    const service = await Service.findOne({ _id: bookingData.service, isActive: true })
      .populate('provider', '_id');

    if (!service) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service not found');
    }

    // Calculate fees
    const serviceFee = service.price;
    const platformFee = Math.round(serviceFee * 0.1); // 10% platform fee
    const totalAmount = serviceFee + platformFee;

    const booking = await Booking.create({
      ...bookingData,
      customer: userId,
      provider: service.provider._id,
      serviceFee,
      platformFee,
      totalAmount,
      bookingDate: new Date(bookingData.bookingDate),
    });

    await booking.populate([
      { path: 'service', select: 'name duration' },
      { path: 'provider', select: 'name email phone' },
    ]);

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
        .populate('provider', 'name email phone')
        .populate('service', 'name duration category')
        .populate({
          path: 'service',
          populate: {
            path: 'category',
            select: 'name',
          },
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
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found or cannot be cancelled');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason,
      },
      { new: true }
    ).populate('provider', 'name email phone').populate('service', 'name');

    return updatedBooking;
  }

  // Reviews
  async createReview(userId: string, reviewData: any) {
    const booking = await Booking.findOne({
      _id: reviewData.booking,
      customer: userId,
      status: BookingStatus.COMPLETED,
    });

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Completed booking not found');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: reviewData.booking });
    if (existingReview) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Review already exists for this booking');
    }

    const review = await Review.create({
      ...reviewData,
      customer: userId,
      provider: booking.provider,
      service: booking.service,
    });

    // Update service rating
    const reviews = await Review.find({ service: booking.service });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Service.findByIdAndUpdate(booking.service, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });

    await review.populate([
      { path: 'service', select: 'name' },
      { path: 'provider', select: 'name' },
    ]);

    return review;
  }

  async getUserReviews(userId: string, query: any = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ customer: userId })
        .populate('service', 'name')
        .populate('provider', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({ customer: userId }),
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
}

export const userService = new UserService();