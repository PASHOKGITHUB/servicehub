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

// Verify JWT token and authenticate user
export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Extract token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      // Find user by ID
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
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
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = authorizeRoles(Roles.ADMIN);

// Check if user is provider
export const isProvider = authorizeRoles(Roles.PROVIDER);

// Check if user is customer
export const isUser = authorizeRoles(Roles.USER);

// Check if user is provider or admin
export const isProviderOrAdmin = authorizeRoles(Roles.PROVIDER, Roles.ADMIN);

// Check if user owns the resource or is admin
export const isOwnerOrAdmin = (resourceUserField: string = 'userId') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Admin can access anything
    if (req.user.role === Roles.ADMIN) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
    
    if (req.user._id.toString() !== resourceUserId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    next();
  });
};