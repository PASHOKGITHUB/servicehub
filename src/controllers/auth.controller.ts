// src/controllers/auth.controller.ts - UPDATED TO AUTO-SEND EMAIL
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants';
import { ApiError } from '../utils/apiError';
import { User } from '../models/user.model';
import { ERROR_MESSAGES } from '../constants/messages';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendVerificationEmail as emailService, sendWelcomeEmail as welcomeEmailService } from '../services/email.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.register(req.body);

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Log registration
  console.log('👤 NEW USER REGISTERED:');
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Email Verified:', user.isEmailVerified);

  // 🔥 AUTOMATICALLY SEND VERIFICATION EMAIL
  try {
    console.log('📧 AUTO-SENDING VERIFICATION EMAIL...');
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, type: 'email-verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    // Send verification email
    const emailResult = await emailService(user.email, verificationLink);
    
    if (emailResult.success) {
      console.log('✅ Verification email sent automatically!');
    }

    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        { 
          user, 
          token,
          emailSent: emailResult.success,
          previewUrl: emailResult.previewUrl // For development
        },
        'Registration successful! Please check your email for verification link.'
      )
    );
  } catch (emailError) {
    console.error('⚠️ Failed to send verification email automatically:', emailError);
    
    // Still return success for registration, but mention email issue
    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        { user, token, emailSent: false },
        'Registration successful! You can request verification email from your dashboard.'
      )
    );
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { user, token },
      SUCCESS_MESSAGES.LOGIN_SUCCESS
    )
  );
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user._id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { user },
      'Profile retrieved successfully'
    )
  );
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { user },
      SUCCESS_MESSAGES.PROFILE_UPDATED
    )
  );
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {},
      SUCCESS_MESSAGES.PASSWORD_CHANGED
    )
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear the cookie
  res.clearCookie('token');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {},
      SUCCESS_MESSAGES.LOGOUT_SUCCESS
    )
  );
});

// Manual verification email sending (for resend requests)
export const sendVerificationEmailController = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified');
  }

  try {
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, type: 'email-verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    console.log('📧 MANUALLY SENDING VERIFICATION EMAIL...');
    console.log('User:', user.email);
    
    const emailResult = await emailService(user.email, verificationLink);
    
    if (emailResult.success) {
      console.log('✅ Verification email sent successfully!');
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK, 
        { 
          previewUrl: emailResult.previewUrl // For development
        },
        'Verification email sent successfully!'
      )
    );
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Verification token is required');
  }

  try {
    console.log('🔍 Verifying email token...');
    
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    if (decoded.type !== 'email-verification') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid verification token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // 🔧 FIX: Handle already verified users gracefully
    if (user.isEmailVerified) {
      console.log('✅ Email already verified for user:', user.email);
      
      // Return success instead of error for already verified users
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
          HTTP_STATUS.OK, 
          { user, alreadyVerified: true }, 
          'Email is already verified! You can proceed to your dashboard.'
        )
      );
    }

    // Verify the email
    user.isEmailVerified = true;
    await user.save();

    console.log('✅ Email verified successfully for user:', user.email);

    // Send welcome email
    try {
      await welcomeEmailService(user.email, user.name);
      console.log('✅ Welcome email sent!');
    } catch (error) {
      console.log('⚠️ Welcome email failed, but verification succeeded');
    }

    // 🔧 FIX: Return user with updated verification status
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK, 
        { user, alreadyVerified: false }, 
        'Email verified successfully! Welcome to ServiceHub!'
      )
    );
  } catch (error) {
    console.error('❌ Email verification failed:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Verification token has expired. Please request a new one.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid verification token');
    } else {
      throw error;
    }
  }
});