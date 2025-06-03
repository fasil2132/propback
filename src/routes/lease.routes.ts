import { express } from 'express';
import { getLeaseById } from '../controllers/lease.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/:leaseId', authenticate, getLeaseById);

export default router;
