export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_REQUIRED: 'Access token is required',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  UNAUTHORIZED: 'Not authorized to access this resource',
  FORBIDDEN: 'Access forbidden',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_VERIFIED: 'Please verify your email address',
  
  // Validation
  VALIDATION_ERROR: 'Validation error',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  
  // File Upload
  FILE_TOO_LARGE: 'File size is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Booking
  BOOKING_NOT_FOUND: 'Booking not found',
  BOOKING_ALREADY_CANCELLED: 'Booking is already cancelled',
  BOOKING_CANNOT_CANCEL: 'Cannot cancel booking at this time',
  
  // Service
  SERVICE_NOT_FOUND: 'Service not found',
  SERVICE_UNAVAILABLE: 'Service is currently unavailable',
  
  // Payment
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  PAYMENT_FAILED: 'Payment processing failed',
};

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  
  // User
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  
  // Booking
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_UPDATED: 'Booking updated successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  
  // Service
  SERVICE_CREATED: 'Service created successfully',
  SERVICE_UPDATED: 'Service updated successfully',
  SERVICE_DELETED: 'Service deleted successfully',
  
  // File Upload
  FILE_UPLOADED: 'File uploaded successfully',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
};
