// src/middlewares/auth.ts - FIXED AUTH MIDDLEWARE
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ApiError } from '../utils/apiError';
import { ERROR_MESSAGES, HTTP_STATUS, Roles } from '../constants';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// 🔧 IMPROVED TOKEN EXTRACTION
const extractToken = (req: Request): string | null => {
  let token: string | null;

  // Method 1: Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔑 Token found in Authorization header');
    return token;
  }

  // Method 2: Check cookies (for HTTP-only cookies)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('🍪 Token found in cookies');
    return token;
  }

  // Method 3: Check custom header (fallback)
  if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'] as string;
    console.log('🔑 Token found in x-auth-token header');
    return token;
  }

  console.log('❌ No token found in any location');
  return null;
};

// Verify JWT token and authenticate user
export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('🔐 AUTH MIDDLEWARE: Starting authentication check');
    console.log('📍 Request details:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });

    // Extract token from multiple sources
    const token = extractToken(req);

    console.log('🔍 Token extraction result:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token?.substring(0, 20) + '...' || 'none'
    });

    if (!token) {
      console.log('❌ AUTH FAILED: No token provided');
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    try {
      console.log('🔍 Verifying JWT token...');
      
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      
      console.log('✅ JWT verification successful:', {
        userId: decoded.userId,
        role: decoded.role,
        iat: new Date(decoded.iat * 1000).toISOString(),
        exp: new Date(decoded.exp * 1000).toISOString()
      });

      // Find user by ID
      console.log('👤 Looking up user in database...');
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.log('❌ AUTH FAILED: User not found in database');
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.USER_NOT_FOUND);
      }

      console.log('✅ User found:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified
      });

      // Check if user is active
      if (!user.isActive) {
        console.log('❌ AUTH FAILED: User account is deactivated');
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated');
      }

      // Attach user to request object
      req.user = user;
      
      console.log('✅ AUTH SUCCESS: User authenticated successfully');
      next();

    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
        console.log('❌ AUTH FAILED: Token verification error:', {
          errorName: (error as { name: string }).name,
          errorMessage: (error as { message: string }).message
        });
      } else {
        console.log('❌ AUTH FAILED: Token verification error:', error);
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_INVALID);
      } else {
        throw error;
      }
    }
  }
);

// Authorize specific roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔒 ROLE AUTHORIZATION: Checking user role');
    
    if (!req.user) {
      console.log('❌ ROLE AUTH FAILED: No user in request');
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    console.log('🔍 Role check:', {
      userRole: req.user.role,
      allowedRoles: roles,
      isAuthorized: roles.includes(req.user.role)
    });

    if (!roles.includes(req.user.role)) {
      console.log('❌ ROLE AUTH FAILED: Insufficient permissions');
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }

    console.log('✅ ROLE AUTH SUCCESS: User authorized');
    next();
  };
};

// Check if user is admin
export const isAdmin = authorizeRoles(Roles.ADMIN);

// Check if user is provider
export const isProvider = authorizeRoles(Roles.PROVIDER);

// Check if user is customer
export const isUser = authorizeRoles(Roles.USER);

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('🔓 OPTIONAL AUTH: Checking for token (non-mandatory)');
    
    const token = extractToken(req);

    if (!token) {
      console.log('ℹ️ OPTIONAL AUTH: No token provided, continuing without auth');
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
        console.log('✅ OPTIONAL AUTH: User authenticated');
      } else {
        console.log('⚠️ OPTIONAL AUTH: Invalid user, continuing without auth');
      }
    } catch (error) {
      console.log('⚠️ OPTIONAL AUTH: Token invalid, continuing without auth');
    }

    next();
  }
);

// Debug middleware to log all requests
export const debugAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('🐛 DEBUG AUTH MIDDLEWARE:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'none',
      cookie: req.headers.cookie ? 'present' : 'none',
      'x-auth-token': req.headers['x-auth-token'] ? 'present' : 'none'
    },
    cookies: Object.keys(req.cookies || {}),
    hasUser: !!req.user
  });
  next();
};