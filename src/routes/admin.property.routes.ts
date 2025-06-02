
import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import { getAdminProperties, updateProperty, deleteProperty, createProperty } from "../controllers/property.controller";

const router = Router();

router.get('/', authenticate, authorizeRoles(['admin']), getAdminProperties);
router.post("/", authenticate, authorizeRoles(['admin']), createProperty);
router.put('/:id', authenticate, authorizeRoles(['admin']), updateProperty);
router.delete('/:id', authenticate, authorizeRoles(['admin']), deleteProperty);

export default router;