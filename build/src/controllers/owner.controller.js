"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerDashboard = exports.getAllOwners = void 0;
// import pool from "../config/database";
const database_1 = __importDefault(require("../config/database"));
const getAllOwners = async (req, res) => {
    try {
        // const [owners] = await pool.execute<RowDataPacket[]>(
        //   "SELECT * FROM users WHERE role = 'owner'"
        // );
        const owners = database_1.default.prepare("SELECT * FROM users WHERE role = 'owner'").all();
        res.json({
            owners
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch owners" });
    }
};
exports.getAllOwners = getAllOwners;
const getOwnerDashboard = async (
// req: Request,
req, res) => {
    try {
        const ownerId = req.user?.id;
        // const [properties] = await pool.execute<RowDataPacket[]>(
        //   "SELECT * FROM properties WHERE ownerId = ?",
        //   [ownerId]
        // );
        const getPStmt = database_1.default.prepare("SELECT * FROM properties WHERE ownerId = ?");
        const properties = getPStmt.all(ownerId);
        // const [payments] = await pool.execute<RowDataPacket[]>(
        //   `
        //   SELECT rp.* FROM rent_payments rp
        //   JOIN leases l ON rp.leaseId = l.id
        //   WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
        // `,
        //   [ownerId]
        // );
        const getPayStmt = database_1.default.prepare(`
        SELECT rp.* FROM rent_payments rp
        JOIN leases l ON rp.leaseId = l.id
        WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `);
        const payments = getPayStmt.all(ownerId);
        // const [requests] = await pool.execute<RowDataPacket[]>(
        //   `
        //   SELECT mr.* FROM maintenance_requests mr
        //   WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
        // `,
        //   [ownerId]
        // );
        const getReqStmt = database_1.default.prepare(`
        SELECT mr.* FROM maintenance_requests mr
        WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `);
        const requests = getReqStmt.all(ownerId);
        // const [tenants] = await pool.execute<RowDataPacket[]>(
        //   `
        //   SELECT u.id as TenantID, u.username, u.email, t.propertyId, p.title as PropertyTitle, p.address, l.startDate as LeaseStartDate, l.endDate as LeaseEndDate
        //   FROM users u
        //   JOIN tenant t ON u.id = t.userId
        //   JOIN properties p ON t.propertyId = p.id
        //   JOIN leases l ON t.id = l.tenantId
        //   WHERE p.ownerId = (SELECT id FROM users WHERE id = ?)
        //   `,
        //   [ownerId]
        // );
        const getTenStmt = database_1.default.prepare(`
        SELECT u.id as TenantID, u.username, u.email, t.propertyId, p.title as PropertyTitle, p.address, l.startDate as LeaseStartDate, l.endDate as LeaseEndDate
        FROM users u
        JOIN tenant t ON u.id = t.userId
        JOIN properties p ON t.propertyId = p.id
        JOIN leases l ON t.id = l.tenantId
        WHERE p.ownerId = (SELECT id FROM users WHERE id = ?)
        `);
        const tenants = getTenStmt.all(ownerId);
        res.json({
            properties,
            payments,
            requests,
            tenants
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch owner dashboard data" });
    }
};
exports.getOwnerDashboard = getOwnerDashboard;
