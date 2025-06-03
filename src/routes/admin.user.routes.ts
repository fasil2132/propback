
import { express } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import { getTenants, getOwners, updateUser, getUsers, deleteUser, createUser } from "../controllers/property.controller";

const router = express.Router();

router.get('/tenants', authenticate, authorizeRoles(['admin']), getTenants);
router.get('/owners', authenticate, authorizeRoles(['admin']), getOwners);
router.get('/', authenticate, authorizeRoles(['admin']), getUsers);
router.post('/create', authenticate, authorizeRoles(['admin']), createUser);
router.put('/:id', authenticate, authorizeRoles(['admin']), updateUser);
router.delete('/:id', authenticate, authorizeRoles(['admin']), deleteUser);

export default router;
