
// import { Request, Response } from "express";
import { Request, Response, NextFunction} from 'express-serve-static-core';
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { User } from "../types/user";
import db from '../config/database';
import { Tenant } from '../models/tenant.model';
import { Lease } from '../models/lease.model';
import ApiError from '../utils/apiError';

export const getTenantLeases = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {

    // Get tenant ID from tenant table
    // const [tenantRows] = await pool.execute<RowDataPacket[]>(
    //   "SELECT id FROM tenant WHERE userId = ?",
    //   [req.params.userId]
    // );

    const stmt = db.prepare("SELECT * FROM tenant WHERE userId = ?");
    const tenantRows = stmt.get(req.params.userId) as Tenant;

    if (!tenantRows) {
      return next(new ApiError(404, "Tenant profile not found"));
    }

    const tenantId = tenantRows.id;

    // const [leases] = await pool.execute<RowDataPacket[]>(
    //   "SELECT * FROM leases WHERE tenantId = ?",
    //   [tenantId]
    // );
    const lStmt = db.prepare("SELECT * FROM leases WHERE tenantId = ?");
    const leases = lStmt.all(tenantId);
    res.json(leases);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leases" });
  }
};

export const getTenantPayments = async (req: Request, res: Response) => {
  try {
    // const [payments] = await pool.execute(
    //   "SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)",
    //   [req.params.tenantId]
    // );
    const pStmt = db.prepare(
      "SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)"
    );
    const payments = pStmt.all(req.params.tenantId);

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

export const getTenantRequests = async (req: Request, res: Response) => {
  try {
    // const [requests] = await pool.execute(
    //   "SELECT * FROM maintenance_requests WHERE tenantId = ?",
    //   [req.params.tenantId]
    // );
    const stmt = db.prepare(
      "SELECT * FROM maintenance_requests WHERE tenantId = ?"
    );
    const requests = stmt.all(req.params.tenantId);

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch maintenance requests" });
  }
};
