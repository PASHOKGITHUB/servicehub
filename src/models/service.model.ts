import { Schema, model, Document, Types } from 'mongoose';

export interface IService extends Document {
  _id: string;
  name: string;
  description: string;
  category: Types.ObjectId;
  provider: Types.ObjectId;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  images: string[];
  serviceAreas: string[];
  tags: string[];
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: [true, 'Service category is required'],
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service provider is required'],
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative'],
  },
  duration: {
    type: Number,
    required: [true, 'Service duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  images: [{
    type: String,
    trim: true,
  }],
  serviceAreas: [{
    type: String,
    trim: true,
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  totalBookings: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
serviceSchema.index({ provider: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ averageRating: -1 });
serviceSchema.index({ totalBookings: -1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ serviceAreas: 1 });

export const Service = model<IService>('Service', serviceSchema);
