import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";

import { User } from "../types/user";
import { Property } from "../models/property.model";
import { RowDataPacket } from "mysql2";
import pool from "../config/database";

export const getAllOwners = async (
  req: Request & { user?: User },
    res: Response
) => {
  try{
    const [owners] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE role = 'owner'"
    );
    res.json({
      owners
    });
  }catch (err) {
    res.status(500).json({ error: "Failed to fetch owners" });
  }
};
export const getOwnerDashboard = async (
    // req: Request,
    req: Request & { user?: User },
    res: Response
  ) => {
    try {
      const ownerId = req.user?.id;
  
      const [properties] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM properties WHERE ownerId = ?",
        [ownerId]
      );
  
      const [payments] = await pool.execute<RowDataPacket[]>(
        `
        SELECT rp.* FROM rent_payments rp
        JOIN leases l ON rp.leaseId = l.id
        WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `,
        [ownerId]
      );
  
      const [requests] = await pool.execute<RowDataPacket[]>(
        `
        SELECT mr.* FROM maintenance_requests mr
        WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `,
        [ownerId]
      );

      const [tenants] = await pool.execute<RowDataPacket[]>(
        `
        SELECT u.id as TenantID, u.username, u.email, t.propertyId, p.title as PropertyTitle, p.address, l.startDate as LeaseStartDate, l.endDate as LeaseEndDate
        FROM users u
        JOIN tenant t ON u.id = t.userId
        JOIN properties p ON t.propertyId = p.id
        JOIN leases l ON t.id = l.tenantId
        WHERE p.ownerId = (SELECT id FROM users WHERE id = ?)
        `,
        [ownerId]
      );
  
      res.json({
        properties,
        payments,
        requests,
        tenants
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch owner dashboard data" });
    }
  };