import { Router } from 'express-serve-static-core';
import { 
  getTenantLeases, 
  getTenantPayments, 
  getTenantRequests 
} from '../controllers/tenant.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/:userId/leases', authenticate, authorizeRoles(['admin', 'tenant']), getTenantLeases);
router.get('/:tenantId/payments', authenticate, authorizeRoles(['admin', 'tenant']), getTenantPayments);
router.get('/:tenantId/maintenance-requests', authenticate, authorizeRoles(['admin', 'tenant']), getTenantRequests);

export default router;
