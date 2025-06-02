import { Router } from 'express';
import { getOwnerDashboard, getAllOwners } from '../controllers/owner.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getOwnerDashboard);
router.get('/all', authenticate, getAllOwners);

export default router;