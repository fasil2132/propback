import dotenv from "dotenv";
// Load environment variables
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import pool from "./src/config/database";
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


// console.log('Current DB Config:', {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD ? '*****' : 'undefined'
// });

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const checkDatabaseConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
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
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database: "Connected",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Server configuration
const PORT: number = parseInt(process.env.PORT as string) || 5000;
// const HOST: string = "192.168.1.7";
const startServer = async () => {
  await checkDatabaseConnection();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
    );
    console.log(`📡 Listening on port ${PORT}`);
  });
};

// Start the server
startServer().catch((error) => {
  console.error("🔥 Failed to start server:", error);
  process.exit(1);
});