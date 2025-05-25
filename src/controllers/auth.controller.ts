// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.register(req.body);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { user, token },
      SUCCESS_MESSAGES.REGISTRATION_SUCCESS
    )
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);

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
  // Since we're using stateless JWT, logout is handled on the client side
  // You can implement token blacklisting here if needed
  
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {},
      SUCCESS_MESSAGES.LOGOUT_SUCCESS
    )
  );
});