// src/routes/user.route.ts
import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth';

const router: Router = Router();

// Placeholder routes - will be implemented later
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

export default router;