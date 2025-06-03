import { Router } from 'express-serve-static-core';
import { getLeaseById } from '../controllers/lease.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:leaseId', authenticate, getLeaseById);

export default router;
