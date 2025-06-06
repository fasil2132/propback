"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantRequests = exports.getTenantPayments = exports.getTenantLeases = void 0;
const database_1 = __importDefault(require("../config/database"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const getTenantLeases = async (req, res, next) => {
    try {
        // Get tenant ID from tenant table
        // const [tenantRows] = await pool.execute<RowDataPacket[]>(
        //   "SELECT id FROM tenant WHERE userId = ?",
        //   [req.params.userId]
        // );
        const stmt = database_1.default.prepare("SELECT * FROM tenant WHERE userId = ?");
        const tenantRows = stmt.get(req.params.userId);
        if (!tenantRows) {
            return next(new apiError_1.default(404, "Tenant profile not found"));
        }
        const tenantId = tenantRows.id;
        // const [leases] = await pool.execute<RowDataPacket[]>(
        //   "SELECT * FROM leases WHERE tenantId = ?",
        //   [tenantId]
        // );
        const lStmt = database_1.default.prepare("SELECT * FROM leases WHERE tenantId = ?");
        const leases = lStmt.all(tenantId);
        res.json(leases);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch leases" });
    }
};
exports.getTenantLeases = getTenantLeases;
const getTenantPayments = async (req, res) => {
    try {
        // const [payments] = await pool.execute(
        //   "SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)",
        //   [req.params.tenantId]
        // );
        const pStmt = database_1.default.prepare("SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)");
        const payments = pStmt.all(req.params.tenantId);
        res.json(payments);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};
exports.getTenantPayments = getTenantPayments;
const getTenantRequests = async (req, res) => {
    try {
        // const [requests] = await pool.execute(
        //   "SELECT * FROM maintenance_requests WHERE tenantId = ?",
        //   [req.params.tenantId]
        // );
        const stmt = database_1.default.prepare("SELECT * FROM maintenance_requests WHERE tenantId = ?");
        const requests = stmt.all(req.params.tenantId);
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch maintenance requests" });
    }
};
exports.getTenantRequests = getTenantRequests;
