"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tenant_controller_1 = require("../controllers/tenant.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/:userId/leases', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin', 'tenant']), tenant_controller_1.getTenantLeases);
router.get('/:tenantId/payments', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin', 'tenant']), tenant_controller_1.getTenantPayments);
router.get('/:tenantId/maintenance-requests', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin', 'tenant']), tenant_controller_1.getTenantRequests);
exports.default = router;
