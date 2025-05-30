import Razorpay from 'razorpay';
import { config } from './index';

export const razorpayInstance = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export const validateRazorpayPayment = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', config.razorpay.keySecret);
  hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === razorpaySignature;
};