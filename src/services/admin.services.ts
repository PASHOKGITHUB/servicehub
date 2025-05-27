import { User, IUser } from '../models/user.model';
import { ServiceCategory, IServiceCategory } from '../models/serviceCategory.model';
import { Service } from '../models/service.model';
import { Booking, BookingStatus } from '../models/booking.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, ERROR_MESSAGES, Roles } from '../constants';

class AdminService {
  // Dashboard Statistics
  async getDashboardStats() {
    const [
      totalUsers,
      totalProviders,
      totalServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: Roles.USER, isActive: true }),
      User.countDocuments({ role: Roles.PROVIDER, isActive: true }),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: BookingStatus.PENDING }),
      Booking.countDocuments({ status: BookingStatus.COMPLETED }),
      Booking.aggregate([
        { $match: { status: BookingStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: BookingStatus.COMPLETED,
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$platformFee' } } },
      ]),
    ]);

    return {
      users: {
        total: totalUsers,
        providers: totalProviders,
        customers: totalUsers,
      },
      services: {
        total: totalServices,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        completed: completedBookings,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
      },
    };
  }

  // User Management
  async getAllUsers(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean, reason?: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  // Provider Management
  async getAllProviders(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { role: Roles.PROVIDER };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [providers, total] = await Promise.all([
      User.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'provider',
            as: 'services',
          },
        },
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'provider',
            as: 'bookings',
          },
        },
        {
          $addFields: {
            servicesCount: { $size: '$services' },
            totalBookings: { $size: '$bookings' },
            totalEarnings: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$bookings',
                      cond: { $eq: ['$$this.status', 'completed'] },
                    },
                  },
                  as: 'booking',
                  in: '$$booking.serviceFee',
                },
              },
            },
          },
        },
        { $project: { password: 0, services: 0, bookings: 0 } },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]),
      User.countDocuments(filter),
    ]);

    return {
      providers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  // Service Category Management
  async createServiceCategory(categoryData: any): Promise<IServiceCategory> {
    // Generate slug from name
    const slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existingCategory = await ServiceCategory.findOne({
      $or: [{ name: categoryData.name }, { slug }],
    });

    if (existingCategory) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'Service category with this name already exists'
      );
    }

    const category = await ServiceCategory.create({
      ...categoryData,
      slug,
    });

    return category;
  }

  async getAllServiceCategories(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = query;

    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [categories, total] = await Promise.all([
      ServiceCategory.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'category',
            as: 'services',
          },
        },
        {
          $addFields: {
            servicesCount: { $size: '$services' },
            activeServicesCount: {
              $size: {
                $filter: {
                  input: '$services',
                  cond: { $eq: ['$$this.isActive', true] },
                },
              },
            },
          },
        },
        { $project: { services: 0 } },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]),
      ServiceCategory.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    };
  }

  async updateServiceCategory(
    categoryId: string,
    updateData: any
  ): Promise<IServiceCategory> {
    // If name is being updated, regenerate slug
    if (updateData.name) {
      const slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const existingCategory = await ServiceCategory.findOne({
        $and: [
          { _id: { $ne: categoryId } },
          { $or: [{ name: updateData.name }, { slug }] },
        ],
      });

      if (existingCategory) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'Service category with this name already exists'
        );
      }

      updateData.slug = slug;
    }

    const category = await ServiceCategory.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service category not found');
    }

    return category;
  }

  async deleteServiceCategory(categoryId: string): Promise<void> {
    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service category not found');
    }

    // Check if category has services
    const servicesCount = await Service.countDocuments({ category: categoryId });
    if (servicesCount > 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot delete category with existing services'
      );
    }

    await ServiceCategory.findByIdAndDelete(categoryId);
  }

  // Bookings Overview
  async getAllBookings(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customer', 'name email phone')
        .populate('provider', 'name email phone')
        .populate('service', 'name category')
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

  // Financial Reports
  async getFinancialReports(query: any = {}) {
    const { startDate, endDate, period = 'month' } = query;

    const matchStage: any = {
      status: BookingStatus.COMPLETED,
    };

    if (startDate || endDate) {
      matchStage.completedAt = {};
      if (startDate) matchStage.completedAt.$gte = new Date(startDate);
      if (endDate) matchStage.completedAt.$lte = new Date(endDate);
    }

    const groupBy = period === 'day' 
      ? { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
      : period === 'week'
      ? { $dateToString: { format: '%Y-W%U', date: '$completedAt' } }
      : { $dateToString: { format: '%Y-%m', date: '$completedAt' } };

    const [revenueData, topServices, topProviders] = await Promise.all([
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupBy,
            totalRevenue: { $sum: '$platformFee' },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$service',
            totalRevenue: { $sum: '$platformFee' },
            totalBookings: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: '_id',
            as: 'serviceData',
          },
        },
        { $unwind: '$serviceData' },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$provider',
            totalRevenue: { $sum: '$serviceFee' },
            totalBookings: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'providerData',
          },
        },
        { $unwind: '$providerData' },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      revenueData,
      topServices,
      topProviders,
    };
  }
}

export const adminService = new AdminService();