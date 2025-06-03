import { Router } from 'express-serve-static-core';
import { getOwnerDashboard, getAllOwners } from '../controllers/owner.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getOwnerDashboard);
router.get('/all', authenticate, getAllOwners);

export default router;
