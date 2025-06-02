import { Request, Response } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { User } from "../types/user";

export const getTenantLeases = async (
  req: Request & { user?: User },
  res: Response
) => {
  try {

    // Get tenant ID from tenant table
    const [tenantRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM tenant WHERE userId = ?",
      [req.params.userId]
    );

    // if (tenantRows.length === 0) {
    //   return next(new ApiError(404, "Tenant profile not found"));
    // }

    const tenantId = tenantRows[0].id;

    const [leases] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM leases WHERE tenantId = ?",
      [tenantId]
    );
    res.json(leases);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leases" });
  }
};

export const getTenantPayments = async (req: Request, res: Response) => {
  try {
    const [payments] = await pool.execute(
      "SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)",
      [req.params.tenantId]
    );
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

export const getTenantRequests = async (req: Request, res: Response) => {
  try {
    const [requests] = await pool.execute(
      "SELECT * FROM maintenance_requests WHERE tenantId = ?",
      [req.params.tenantId]
    );
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch maintenance requests" });
  }
};
