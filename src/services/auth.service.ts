// src/services/auth.service.ts - Simple and effective
import { User, IUser } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

class AuthService {
  async register(userData: RegisterUserData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Create new user
    const user = await User.create(userData);

    // Generate auth token
    const token = user.generateAuthToken();

    return { user, token };
  }

  async login(loginData: LoginUserData): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    // Remove password from response
    user.password = undefined as any;

    return { user, token };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    // Remove sensitive fields from update data
    const { password, role, isEmailVerified, isPhoneVerified, ...safeUpdateData } = updateData as any;

    const user = await User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }
}

export const authService = new AuthService();