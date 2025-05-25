import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';

const router: Router = Router();

// Placeholder routes - will be implemented later
router.get('/', isAuthenticated, (req, res) => {
  res.json({ message: 'Review routes - Coming soon' });
});

export default router;