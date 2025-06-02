
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getMaintenanceRequests, createMaintenanceRequest, updateRequestStatus } from "../controllers/property.controller";

const router = Router();

// Maintenance Requests
router.get('/', getMaintenanceRequests);
router.post('/create', createMaintenanceRequest);
router.put('/:id/status', updateRequestStatus);

export default router;