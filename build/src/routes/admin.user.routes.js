"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const property_controller_1 = require("../controllers/property.controller");
const router = express_1.default.Router();
router.get('/tenants', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.getTenants);
router.get('/owners', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.getOwners);
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.getUsers);
router.post('/create', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.createUser);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.updateUser);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(['admin']), property_controller_1.deleteUser);
exports.default = router;
