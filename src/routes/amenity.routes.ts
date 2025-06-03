import express from "express";
import { getAmenities } from "../controllers/property.controller";

const router = express.Router();

router.get("/", getAmenities);

export default router;
