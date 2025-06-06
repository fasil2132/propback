// import { Request, Response } from "express";
import { Request, Response} from 'express-serve-static-core';
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import db from '../config/database';
import { Lease } from '../models/lease.model';
import { Property } from '../models/property.model';
import { Tenant } from '../models/tenant.model';
import { RentPayment } from '../models/rentpayment.model';



export const getLeaseById = async (req: Request, res: Response) => {
  try {

    // const [lease] = await pool.execute<RowDataPacket[]>(
    //   `
    //   SELECT 
    //     l.*,
    //     JSON_OBJECT(
    //       'id', p.id,
    //       'title', p.title,
    //       'address', p.address
    //     ) AS property,
    //     JSON_OBJECT(
    //       'id', t.id,
    //       'user', JSON_OBJECT(
    //         'name', u.username,
    //         'email', u.email
    //       )
    //     ) AS tenant,
    //     COALESCE(
    //       JSON_ARRAYAGG(
    //         JSON_OBJECT(
    //           'id', rp.id,
    //           'amount', rp.amount,
    //           'paymentDate', rp.paymentDate,
    //           'method', rp.method
    //         )
    //       ),
    //       JSON_ARRAY()
    //     ) AS payments
    //   FROM leases l
    //   JOIN properties p ON l.propertyId = p.id
    //   JOIN tenants t ON l.tenantId = t.id
    //   JOIN users u ON t.userId = u.id
    //   LEFT JOIN rent_payments rp ON l.id = rp.leaseId
    //   WHERE l.id = ?
    //   GROUP BY l.id
    // `,
    //   [req.params.leaseId]
    // );
    const getStmt = db.prepare(
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
    `
    );

    const lease = getStmt.all(req.params.leaseId) as Lease[];
    if (!lease.length)
      return res.status(404).json({ error: "Lease not found" });

    const getPropStmt = db.prepare("SELECT * FROM properties WHERE id = ?");
    const prop = getPropStmt.get(lease[0].propertyId) as Property;

    const getTenStmt = db.prepare("SELECT * FROM tenant WHERE id = ?");
    const ten = getPropStmt.get(lease[0].tenantId) as Tenant;

    const getPayStmt = db.prepare("SELECT * FROM rent_payments WHERE leaseId = ?");
    const pay = getPropStmt.all(lease[0].id) as RentPayment[];

    const formattedLease = {
      ...lease[0],
      // property: JSON.parse(lease[0].property),
      // tenant: JSON.parse(lease[0].tenant),
      // payments: JSON.parse(lease[0].payments),

      // property: JSON.parse(prop),
      // tenant: JSON.parse(ten),
      // payments: JSON.parse(pay),

      property: prop,
      tenant: ten,
      payments: pay,
    };

    res.json(formattedLease);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lease" });
  }
};
