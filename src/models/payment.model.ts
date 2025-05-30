import { Schema, model, Document, Types } from 'mongoose';

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  WALLET = 'wallet',
  COD = 'cod',
}

export enum PaymentGatewayStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export interface IPayment extends Document {
  _id: string;
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentGatewayStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  gatewayResponse?: any;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required'],
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider reference is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR'],
  },
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: [true, 'Payment method is required'],
  },
  status: {
    type: String,
    enum: Object.values(PaymentGatewayStatus),
    default: PaymentGatewayStatus.CREATED,
  },
  razorpayOrderId: {
    type: String,
    sparse: true,
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
  },
  razorpaySignature: {
    type: String,
    sparse: true,
  },
  gatewayResponse: {
    type: Schema.Types.Mixed,
  },
  failureReason: {
    type: String,
    trim: true,
  },
  refundId: {
    type: String,
    sparse: true,
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
paymentSchema.index({ booking: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ provider: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);