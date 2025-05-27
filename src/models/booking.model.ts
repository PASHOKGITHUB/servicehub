import { Schema, model, Document, Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface IBooking extends Document {
  _id: string;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: Types.ObjectId;
  bookingDate: Date;
  timeSlot: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  serviceFee: number;
  platformFee: number;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  customerNotes?: string;
  providerNotes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required'],
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required'],
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  serviceFee: {
    type: Number,
    required: [true, 'Service fee is required'],
    min: [0, 'Service fee cannot be negative'],
  },
  platformFee: {
    type: Number,
    required: [true, 'Platform fee is required'],
    min: [0, 'Platform fee cannot be negative'],
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid pincode'],
    },
    landmark: {
      type: String,
      trim: true,
    },
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer notes cannot exceed 500 characters'],
  },
  providerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Provider notes cannot exceed 500 characters'],
  },
  completedAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
  cancelReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancel reason cannot exceed 200 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
bookingSchema.index({ customer: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ service: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = model<IBooking>('Booking', bookingSchema);