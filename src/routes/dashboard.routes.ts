import express from "express";
import { getDashboardData, getMyProperties } from "../controllers/property.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/:userId", authenticate, getDashboardData);

export default router;
