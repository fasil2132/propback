import dotenv from "dotenv";
// Load environment variables
dotenv.config();
import express from "express";
import type { Application } from 'express';
import cors from "cors";
import morgan from "morgan";
import db from "./src/config/database";

// Import routes
import authRoutes from "./src/routes/auth.routes";
import propertyRoutes from "./src/routes/property.routes";
import adminPropertyRoutes from "./src/routes/admin.property.routes";
import adminUserRoutes from "./src/routes/admin.user.routes";
import maintenanceRoutes from "./src/routes/maintenance.routes";
import dashboardRouter from "./src/routes/dashboard.routes";
import leaseRouter from "./src/routes/lease.routes";
import tenantRouter from "./src/routes/tenant.routes";
import ownerRouter from "./src/routes/owner.routes";

import { errorHandler } from "./src/middleware/error.middleware";
import { getAmenities } from "./src/controllers/property.controller";

// Create Express app
const app: Application = express();

// Configure middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Database connection check (SQLite version)
const checkDatabaseConnection = () => {
  try {
    // Simple query to verify database accessibility
    db.prepare("SELECT 1 AS test").get();
    console.log('✅ SQLite database connected successfully');
    
    // Additional verification: Check if tables exist
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    console.log(`📊 Found ${tableCheck.length} tables in database`);
  } catch (error) {
    console.error('❌ SQLite database connection error:', error);
    process.exit(1);
  }
};

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/amenities", getAmenities);

app.use("/api/admin/properties", adminPropertyRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/maintenance", maintenanceRoutes);

app.use('/api/dashboard', dashboardRouter);
app.use('/api/leases', leaseRouter);
app.use('/api/tenants', tenantRouter);
app.use('/api/owners', ownerRouter);

// Health check endpoint
// app.get("/api/health", (req, res) => {
//   try {
//     const dbStatus = db.prepare("SELECT 1 AS status").get().status  === 1;
    
//     res.status(200).json({
//       status: "OK",
//       database: dbStatus ? "Connected" : "Unresponsive",
//       timestamp: new Date().toISOString(),
//       tables: db.prepare("SELECT count(*) AS count FROM sqlite_master").get().count
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "ERROR",
//       database: "Connection failed",
//       error: error.message
//     });
//   }
// });

// Error handling middleware
app.use(errorHandler);

// Server configuration
const PORT: number = parseInt(process.env.PORT as string) || 5000;

const startServer = async () => {
  // Check database connection
  checkDatabaseConnection();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
    );
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`💾 Database file: ${process.env.DB_PATH || 'memory'}`);
  });
};

// Start the server
startServer().catch((error) => {
  console.error("🔥 Failed to start server:", error);
  process.exit(1);
});