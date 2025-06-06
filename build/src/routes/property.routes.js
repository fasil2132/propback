"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// // src/routes/property.routes.ts
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const property_controller_1 = require("../controllers/property.controller");
const router = express_1.default.Router();
router.get("/", property_controller_1.getProperties);
router.get("/me", auth_middleware_1.authenticate, property_controller_1.getMyProperties); // Apply middleware here
router.get("/:id", property_controller_1.getPropertyById);
router.post("/", auth_middleware_1.authenticate, property_controller_1.createProperty);
// router.get("/amenities", getAmenities); // Add this line
router.put("/:id/amenities", property_controller_1.updatePropertyAmenities);
exports.default = router;
