// import { Lease } from './../../../property-management-frontend/src/models/types';
// import { Request, Response, NextFunction } from "express";
import { Request, Response, NextFunction } from 'express-serve-static-core';
import ApiError from "../utils/apiError";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { User } from "../types/user";
import { Property } from "../models/property.model";
import { Console } from "console";
import bcrypt from "bcryptjs";
import { strict } from "assert";
import { Tenant } from "../models/tenant.model";
import { RentPayment } from "../models/rentpayment.model";
import { getTenantLeases } from "./tenant.controller";

interface MaintenanceRequestRow extends RowDataPacket {   
  id: number;
  description: string;
  status: string;
  createdAt: Date;
  propertyId: number;
  tenantId: number;
  tenantName: string;
  propertyTitle: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  propertyCount?: number;
  leaseEnd?: Date;
}

interface Amenity extends RowDataPacket {
  id: number;
  name: string;
}

interface PropertyRow extends RowDataPacket {
  id: number;
  title: string;
  type: "rent" | "sale";
  category?: "residential" | "commercial" | "industrial";
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  status: string;
  image: string;
  location: string;
  ownerId: number;
  createdAt: Date;
  amenities: string;
}
interface LeaseRow extends RowDataPacket {
  id: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  // property: {
  //   id: number;
  //   title: string;
  //   address: string;
  // };
  property: Property;
  // tenant: {
  //   id: number;
  //   user: {
  //     name: string;
  //     email: string;
  //   };
  tenant: Tenant;
  payments: RentPayment[];
  terms?: string;
}

const basePropertyQuery0 = `
  SELECT p.*, 
  GROUP_CONCAT(a.name) AS amenities 
  FROM properties p
  LEFT JOIN property_amenities pa ON p.id = pa.propertyId
  LEFT JOIN amenities a ON pa.amenityId = a.id
`;

const basePropertyQuery = `
  SELECT p.*, 
    COALESCE(
      JSON_ARRAYAGG(
        JSON_OBJECT('id', a.id, 'name', a.name)
      ), 
      JSON_ARRAY()
    ) AS amenities 
  FROM properties p
  LEFT JOIN property_amenities pa ON p.id = pa.propertyId
  LEFT JOIN amenities a ON pa.amenityId = a.id
`;

export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.body);
    const {
      title,
      type,
      category,
      description,
      address,
      price,
      bedrooms,
      bathrooms,
      square_feet,
      status,
      image,
      location,
      ownerId,
    } = req.body;

    // Validate numeric fields
    if (
      isNaN(price) ||
      isNaN(bedrooms) ||
      isNaN(bathrooms) ||
      isNaN(square_feet)
    ) {
      throw new ApiError(400, "Invalid numeric field values");
    }

    if (
      title === undefined ||
      type === undefined ||
      category === undefined ||
      description === undefined ||
      address === undefined ||
      price === undefined ||
      bedrooms === undefined ||
      bathrooms === undefined ||
      square_feet === undefined ||
      status === undefined ||
      image === undefined ||
      location === undefined ||
      ownerId === undefined
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const [result] = await pool.execute(
      "INSERT INTO properties (title, type, category, description, address, price, bedrooms, bathrooms, square_feet, status, image, location, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        type,
        category,
        description,
        address,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        status,
        image,
        location,
        ownerId,
      ]
    );

    console.log(result);
    res.status(201).json({
      id: (result as any).insertId,
      title,
      type,
      category,
      description,
      address,
      price,
      bedrooms,
      bathrooms,
      square_feet,
      status,
      image,
      location,
      ownerId,
    });
  } catch (err) {
    next(err);
  }
};

export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { minPrice, maxPrice, bedrooms, bathrooms, type, category, status } =
      req.query;

    let query = `${basePropertyQuery} WHERE 1=1 `;

    const params: any[] = [];

    if (
      (minPrice && isNaN(Number(minPrice))) ||
      (maxPrice && isNaN(Number(maxPrice))) ||
      (bedrooms && isNaN(Number(bedrooms))) ||
      (bathrooms && isNaN(Number(bathrooms)))
    ) {
      return next(new ApiError(400, "Invalid  parameters"));
    }
    // Add filters dynamically
    if (minPrice) {
      query += " AND price >= ?";
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += " AND price <= ?";
      params.push(Number(maxPrice));
    }

    if (bedrooms && Number(bedrooms) > 0) {
      query += " AND bedrooms >= ?";
      params.push(Number(bedrooms));
    }
    if (bathrooms && Number(bathrooms) > 0) {
      query += " AND bathrooms >= ?";
      params.push(Number(bathrooms));
    }
    if (type) {
      query += " AND type = ?";
      params.push(String(type));
    }
    if (category) {
      query += " AND category = ?";
      params.push(String(category));
    }
    if (status) {
      query += " AND status = ?";
      params.push(String(status));
    }

    const amenitiesFilter = req.query.amenities;
    const amenityIds = amenitiesFilter
      ? Array.isArray(amenitiesFilter)
        ? amenitiesFilter
        : [amenitiesFilter]
      : [];

    amenityIds.forEach((amenityId) => {
      query += `
    AND EXISTS (
      SELECT 1 
      FROM property_amenities pa 
      WHERE pa.propertyId = p.id 
        AND pa.amenityId = ?
    )`;
      params.push(Number(amenityId));
    });

    query += " GROUP BY p.id";

    const [rows] = await pool.execute<PropertyRow[]>(query, params);

    const properties = rows.map((row) => ({
      ...row,
      // amenities: JSON.parse(row.amenities) // Parse the JSON string
    }));

    res.status(200).json(properties);
  } catch (err) {
    console.error("Error in getMyProperties:", err);
    next(err);
  }
};

export const getMyProperties = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next(new ApiError(401, "User not authenticated"));
    }

    // console.log("Fetching properties for user ID:", req.user.id);
    // const [properties] = await pool.execute(
    //   "SELECT * FROM properties WHERE ownerId = ?",
    //   [req.user.id]
    // );

    const query = `${basePropertyQuery} WHERE p.ownerId = ? GROUP BY p.id`;
    const [rows] = await pool.execute<PropertyRow[]>(query, [req.user.id]);
    const properties = rows.map((row) => ({
      ...row,
      // amenities: JSON.parse(row.amenities),
    }));

    // console.log("Found properties:", properties);

    res.status(200).json(properties);
  } catch (err) {
    console.error("Error in getMyProperties:", err);
    next(err);
  }
};

export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const [properties] = await pool.execute(
    //   "SELECT * FROM properties WHERE id = ?",
    //   [req.params.id]
    // );

    const [rows] = await pool.execute<PropertyRow[]>(
      `${basePropertyQuery} WHERE p.id = ? GROUP BY p.id`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return next(new ApiError(404, "Property not found"));
    }
    // const properties = rows.map((row) => ({
    //   ...row,
    //   amenities: JSON.parse(row.amenities),
    // }));

    const property = {
      ...rows[0],
      // amenities: JSON.parse(rows[0].amenities)
    };

    // if (!Array.isArray(properties) || properties.length === 0) {
    //   return next(new ApiError(404, "Property not found"));
    // }

    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

// Add after existing controllers
export const getAmenities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [amenities] = await pool.execute<Amenity[]>(
      "SELECT * FROM amenities"
    );
    res.status(200).json(amenities);
  } catch (err) {
    next(err);
  }
};

export const updatePropertyAmenities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { amenities } = req.body;

  try {
    await pool.execute("DELETE FROM property_amenities WHERE propertyId = ?", [
      id,
    ]);

    if (amenities && amenities.length > 0) {
      const values = amenities.map((amenityId: number) => [id, amenityId]);
      await pool.query(
        "INSERT INTO property_amenities (propertyId, amenity_id) VALUES ?",
        [values]
      );
    }

    res.status(200).json({ message: "OK" });
  } catch (err) {
    next(err);
  }
};

// Admin Property Controllers
export const getAdminProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = `
      ${basePropertyQuery} 
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `;
    const [rows] = await pool.execute<PropertyRow[]>(query);

    const properties = rows.map((row) => ({
      ...row,
      // amenities: JSON.parse(row.amenities),
    }));

    res.status(200).json(properties);
  } catch (err) {
    next(err);
  }
};

export const updateProperty = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Dynamic field updates
    const validFields = [
      "title",
      "description",
      "price",
      "status",
      "type",
      "category",
    ];
    const setClause = Object.keys(updateFields)
      .filter((key) => validFields.includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    if (!setClause) {
      return next(new ApiError(400, "No valid fields to update"));
    }

    const values = [
      ...Object.values(updateFields).filter((_, i) =>
        validFields.includes(Object.keys(updateFields)[i])
      ),
      id,
    ];

    await pool.execute(
      `UPDATE properties SET ${setClause} WHERE id = ?`,
      values
    );

    // Get updated property
    const [updatedProperty] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    // res.status(200).json({ message: "Property updated successfully" });
    res.status(200).json(updatedProperty[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteProperty = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Using transactions for data integrity
    await pool.query("START TRANSACTION");

    // Delete related records first
    await pool.query("DELETE FROM property_amenities WHERE propertyId = ?", [
      id,
    ]);
    await pool.query("DELETE FROM properties WHERE id = ?", [id]);

    await pool.query("COMMIT");

    res.status(204).send();
  } catch (err) {
    await pool.query("ROLLBACK");
    next(err);
  }
};

// User Management Controllers
export const getTenants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = `
      SELECT u.*, t.leaseEnd, COUNT(p.id) as propertyCount
      FROM users u
      LEFT JOIN tenant t ON u.id = t.userId
      LEFT JOIN properties p ON u.id = p.ownerId
      WHERE u.role = 'tenant'
      GROUP BY u.id
    `;

    const [tenants] = await pool.execute<UserRow[]>(query);
    res.status(200).json(tenants);
  } catch (err) {
    next(err);
  }
};

export const getOwners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = `
      SELECT u.*, COUNT(p.id) as propertyCount 
      FROM users u
      LEFT JOIN properties p ON u.id = p.ownerId
      WHERE u.role = 'owner'
      GROUP BY u.id
    `;

    const [owners] = await pool.execute<UserRow[]>(query);
    res.status(200).json(owners);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  // req: Request,
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role, ...updateData } = req.body;

    // Prevent role escalation
    if (req.user?.role !== "admin" && role) {
      return next(new ApiError(403, "Only admins can change roles"));
    }

    const validFields = ["username", "email", "role"];
    const setClause = Object.keys(updateData)
      .filter((key) => validFields.includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    if (!setClause) {
      return next(new ApiError(400, "No valid fields to update"));
    }

    const values = [
      ...Object.values(updateData).filter((_, i) =>
        validFields.includes(Object.keys(updateData)[i])
      ),
      id,
    ];

    await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    next(err);
  }
};

// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { role } = req.body;

//     await pool.execute(
//       'UPDATE users SET role = ? WHERE id = ?',
//       [role, id]
//     );
//     res.json({ message: 'User updated successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update user' });
//   }
// };

// export const getUsers = async (req: Request, res: Response) => {
//   try {
//     const [users] = await pool.execute(`
//       SELECT u.*, COUNT(p.id) as propertyCount
//       FROM users u
//       LEFT JOIN properties p ON u.id = p.ownerId
//       GROUP BY u.id
//     `);
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// };

// src/controllers/property.controller.ts
export const getUsers = async (req: Request, res: Response) => {
  try {
    const [users] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        DATE_FORMAT(u.createdAt, '%Y-%m-%d') AS createdAt,
        COUNT(p.id) as propertyCount 
      FROM users u
      LEFT JOIN properties p ON u.id = p.ownerId
      GROUP BY u.id
    `);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Add to property.controller.ts
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existing.length > 0) {
      throw new ApiError(400, "Username or email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );

    const [newUser] = await pool.execute<RowDataPacket[]>(
      "SELECT id, username, email, role, createdAt FROM users WHERE id = ?",
      [(result as any).insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
};

// // Maintenance Request Controllers
// export const getMaintenanceRequests = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { status, propertyId } = req.query;
//     let query = `
//       SELECT mr.*, p.title as propertyTitle, u.username as tenantName
//       FROM maintenancerequests mr
//       JOIN properties p ON mr.propertyId = p.id
//       JOIN users u ON mr.tenantId = u.id
//       WHERE 1=1
//     `;

//     const params = [];

//     if (status) {
//       query += " AND mr.status = ?";
//       params.push(status);
//     }

//     if (propertyId) {
//       query += " AND mr.propertyId = ?";
//       params.push(propertyId);
//     }

//     query += " ORDER BY mr.createdAt DESC";

//     const [requests] = await pool.execute<MaintenanceRequestRow[]>(
//       query,
//       params
//     );
//     res.status(200).json(requests);
//   } catch (err) {
//     next(err);
//   }
// };

export const getMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId;
    let query = `
      SELECT mr.*, p.title AS propertyTitle, u.username AS tenantName
      FROM maintenance_requests mr
      JOIN properties p ON mr.propertyId = p.id
      JOIN users u ON mr.tenantId = u.id
    `;

    const params = [];

    if (tenantId) {
      query += " WHERE mr.tenantId = ?";
      params.push(tenantId);
    }

    const [requests] = await pool.execute(query, params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch maintenance requests" });
  }
};

export const createMaintenanceRequest = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    const { propertyId, description } = req.body;

    if (!req.user || req.user.role !== "tenant") {
      return next(
        new ApiError(403, "Only tenants can create maintenance requests")
      );
    }

    // Get tenant ID from tenant table
    const [tenantRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM tenant WHERE userId = ?",
      [req.user.id]
    );

    if (tenantRows.length === 0) {
      return next(new ApiError(404, "Tenant profile not found"));
    }

    const tenantId = tenantRows[0].id;

    await pool.execute(
      `INSERT INTO maintenancerequests 
       (propertyId, tenantId, description, status)
       VALUES (?, ?, ?, 'pending')`,
      [propertyId, tenantId, description]
    );

    res.status(201).json({ message: "Maintenance request created" });
  } catch (err) {
    next(err);
  }
};

export const updateRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return next(new ApiError(400, "Invalid status"));
    }

    await pool.execute(
      "UPDATE maintenancerequests SET status = ? WHERE id = ?",
      [status, id]
    );

    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getDashboardData = async (
  // req: Request,
  req: Request & { user?: User },
  res: Response
) => {
  try {
    const userId = req.params.userId;
    // console.log(userId ? userId : "NO USER ID FOUND");
    const [userRows] = await pool.execute<RowDataPacket[]>(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = userRows[0].role;

    if (userRole === "admin") {
      const [properties] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM properties"
      );
      const [leases] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM leases"
      );
      const [payments] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM rent_payments"
      );
      const [requests] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM maintenancerequests"
      );
      const [users] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM users"
      );
      // const [properties, leases, payments, requests] = await Promise.all([
      //   pool.execute<RowDataPacket[]>("SELECT * FROM properties"),
      //   pool.execute<RowDataPacket[]>("SELECT * FROM leases"),
      //   pool.execute<RowDataPacket[]>("SELECT * FROM rent_payments"),
      //   pool.execute<RowDataPacket[]>("SELECT * FROM maintenancerequests"),
      // ]);

      return res.json({
        properties,
        leases,
        payments,
        requests,
        users,
      });
    }

    if (userRole === "owner") {
      const [properties] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM properties WHERE ownerId = ?",
        [userId]
      );

      const [payments] = await pool.execute<RowDataPacket[]>(
        `
          SELECT rp.* 
          FROM rent_payments rp
          JOIN leases l ON rp.leaseId = l.id
          JOIN properties p ON l.propertyId = p.id
          WHERE p.ownerId = ?
        `,
        [userId]
      );

      const [leases] = await pool.execute<RowDataPacket[]>(
        `SELECT L.* FROM leases l
        WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
         `,
        [userId]
      );

      const [requests] = await pool.execute<RowDataPacket[]>(
        `
        SELECT mr.* FROM maintenancerequests mr
        WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `,
        [userId]
      );

      const [tenants] = await pool.execute<RowDataPacket[]>(
        `
        SELECT u.id as tenantId, u.username, u.email, t.propertyId, p.title as propertyTitle, p.address, l.startDate as leaseStart, l.endDate as leaseEnd
        FROM users u
        JOIN tenant t ON u.id = t.userId
        JOIN properties p ON t.propertyId = p.id
        JOIN leases l ON t.id = l.tenantId
        WHERE p.ownerId = (SELECT id FROM users WHERE id = ?)
        `,
        [userId]
      );

      // console.log("Properties:", properties);
      // console.log("Leases:", leases);
      // console.log("Payments:", payments);

      return res.json({
        properties,
        payments,
        leases,
        requests,
        tenants,
      });
    }

    if (userRole === "tenant") {
      const [tenantId] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM tenant WHERE userId = ?",
        [userId]
      );
      // console.log(tenantId[0]);
      const [leases] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM leases WHERE tenantId = ?",
        [tenantId[0].id]
      );

      const [payments] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM rent_payments WHERE leaseId IN (SELECT id FROM leases WHERE tenantId = ?)",
        [tenantId[0].id]
      );

      const [requests] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM maintenancerequests WHERE tenantId = ?",
        [tenantId[0].id]
      );

      // console.log([leases]);
      return res.json({
        leases,
        payments,
        requests,
      });
    }

    res.status(403).json({ error: "Unauthorized access" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Add to property.controller.ts
// export const getOwnerDashboard = async (req: Request, res: Response) => {
//   try {
//     const ownerId = req.user?.id;

//     const [properties] = await pool.execute(
//       "SELECT * FROM properties WHERE ownerId = ?",
//       [ownerId]
//     );

//     const [payments] = await pool.execute(
//       `
//       SELECT rp.* FROM rent_payments rp
//       JOIN leases l ON rp.leaseId = l.id
//       WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
//     `,
//       [ownerId]
//     );

//     const [requests] = await pool.execute(
//       `
//       SELECT mr.* FROM maintenance_requests mr
//       WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
//     `,
//       [ownerId]
//     );

//     res.json({
//       properties,
//       payments,
//       requests,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch owner dashboard data" });
//   }
// };
