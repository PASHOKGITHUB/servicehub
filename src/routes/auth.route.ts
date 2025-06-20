// src/routes/auth.route.ts
import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  sendVerificationEmailController,
  verifyEmail,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { isAuthenticated } from '../middlewares/auth';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.schema';

const router: Router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/verify-email', verifyEmail); // Email verification endpoint

// Protected routes
router.use(isAuthenticated);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);
router.post('/send-verification', sendVerificationEmailController); // Send verification email

export default router;