"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const owner_controller_1 = require("../controllers/owner.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticate, owner_controller_1.getOwnerDashboard);
router.get('/all', auth_middleware_1.authenticate, owner_controller_1.getAllOwners);
exports.default = router;
