import { Schema, model, Document } from 'mongoose';

export interface IServiceCategory extends Document {
  _id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCategorySchema = new Schema<IServiceCategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
serviceCategorySchema.index({ slug: 1 });
serviceCategorySchema.index({ isActive: 1 });
serviceCategorySchema.index({ sortOrder: 1 });

// Virtual for services count
serviceCategorySchema.virtual('servicesCount', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

export const ServiceCategory = model<IServiceCategory>('ServiceCategory', serviceCategorySchema);
