import { Request, Response } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";



export const getLeaseById = async (req: Request, res: Response) => {
  try {
    const [lease] = await pool.execute<RowDataPacket[]>(
      `
      SELECT 
        l.*,
        JSON_OBJECT(
          'id', p.id,
          'title', p.title,
          'address', p.address
        ) AS property,
        JSON_OBJECT(
          'id', t.id,
          'user', JSON_OBJECT(
            'name', u.username,
            'email', u.email
          )
        ) AS tenant,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', rp.id,
              'amount', rp.amount,
              'paymentDate', rp.paymentDate,
              'method', rp.method
            )
          ),
          JSON_ARRAY()
        ) AS payments
      FROM leases l
      JOIN properties p ON l.propertyId = p.id
      JOIN tenants t ON l.tenantId = t.id
      JOIN users u ON t.userId = u.id
      LEFT JOIN rent_payments rp ON l.id = rp.leaseId
      WHERE l.id = ?
      GROUP BY l.id
    `,
      [req.params.leaseId]
    );

    if (!lease.length)
      return res.status(404).json({ error: "Lease not found" });

    const formattedLease = {
      ...lease[0],
      property: JSON.parse(lease[0].property),
      tenant: JSON.parse(lease[0].tenant),
      payments: JSON.parse(lease[0].payments),
    };

    res.json(formattedLease);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lease" });
  }
};
