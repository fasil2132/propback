// // src/routes/property.routes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createProperty, getProperties, getPropertyById, getMyProperties, updatePropertyAmenities, getAmenities } from "../controllers/property.controller";

const router = Router();

router.get("/", getProperties);
router.get("/me", authenticate, getMyProperties); // Apply middleware here
router.get("/:id", getPropertyById);
router.post("/", authenticate, createProperty);
// router.get("/amenities", getAmenities); // Add this line
router.put("/:id/amenities", updatePropertyAmenities);

export default router;