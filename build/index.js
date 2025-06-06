"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = __importDefault(require("./src/config/database"));
// Import routes
const auth_routes_1 = __importDefault(require("./src/routes/auth.routes"));
const property_routes_1 = __importDefault(require("./src/routes/property.routes"));
const admin_property_routes_1 = __importDefault(require("./src/routes/admin.property.routes"));
const admin_user_routes_1 = __importDefault(require("./src/routes/admin.user.routes"));
const maintenance_routes_1 = __importDefault(require("./src/routes/maintenance.routes"));
const dashboard_routes_1 = __importDefault(require("./src/routes/dashboard.routes"));
const lease_routes_1 = __importDefault(require("./src/routes/lease.routes"));
const tenant_routes_1 = __importDefault(require("./src/routes/tenant.routes"));
const owner_routes_1 = __importDefault(require("./src/routes/owner.routes"));
const error_middleware_1 = require("./src/middleware/error.middleware");
const property_controller_1 = require("./src/controllers/property.controller");
// Create Express app
const app = (0, express_1.default)();
// Configure middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
// Database connection check (SQLite version)
const checkDatabaseConnection = () => {
    try {
        // Simple query to verify database accessibility
        database_1.default.prepare("SELECT 1 AS test").get();
        console.log('✅ SQLite database connected successfully');
        // Additional verification: Check if tables exist
        const tableCheck = database_1.default.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(`📊 Found ${tableCheck.length} tables in database`);
    }
    catch (error) {
        console.error('❌ SQLite database connection error:', error);
        process.exit(1);
    }
};
// API Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/properties", property_routes_1.default);
app.use("/api/amenities", property_controller_1.getAmenities);
app.use("/api/admin/properties", admin_property_routes_1.default);
app.use("/api/admin/users", admin_user_routes_1.default);
app.use("/api/maintenance", maintenance_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/leases', lease_routes_1.default);
app.use('/api/tenants', tenant_routes_1.default);
app.use('/api/owners', owner_routes_1.default);
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
app.use(error_middleware_1.errorHandler);
// Server configuration
const PORT = parseInt(process.env.PORT) || 5000;
const startServer = async () => {
    // Check database connection
    checkDatabaseConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
        console.log(`📡 Listening on port ${PORT}`);
        console.log(`💾 Database file: ${process.env.DB_PATH || 'memory'}`);
    });
};
// Start the server
startServer().catch((error) => {
    console.error("🔥 Failed to start server:", error);
    process.exit(1);
});
