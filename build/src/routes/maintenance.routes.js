"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const property_controller_1 = require("../controllers/property.controller");
const router = express_1.default.Router();
// Maintenance Requests
router.get('/', property_controller_1.getMaintenanceRequests);
router.post('/create', property_controller_1.createMaintenanceRequest);
router.put('/:id/status', property_controller_1.updateRequestStatus);
exports.default = router;
