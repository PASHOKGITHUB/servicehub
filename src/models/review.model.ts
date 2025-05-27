import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  isVisible: boolean;
  providerReply?: string;
  providerReplyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
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
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required'],
    unique: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  images: [{
    type: String,
    trim: true,
  }],
  isVisible: {
    type: Boolean,
    default: true,
  },
  providerReply: {
    type: String,
    trim: true,
    maxlength: [300, 'Provider reply cannot exceed 300 characters'],
  },
  providerReplyAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
reviewSchema.index({ customer: 1 });
reviewSchema.index({ provider: 1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isVisible: 1 });

export const Review = model<IReview>('Review', reviewSchema);