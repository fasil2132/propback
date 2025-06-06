import { Request, Response, NextFunction } from "express-serve-static-core";
import ApiError from "../utils/apiError";
import db from "../config/database"; // Changed from pool to db
import { User } from "../types/user";
import { Property } from "../models/property.model";
import { Tenant } from "../models/tenant.model";
import { RentPayment } from "../models/rentpayment.model";
import bcrypt from "bcryptjs";

// Removed RowDataPacket interfaces since SQLite returns plain objects
interface MaintenanceRequest {
  id: number;
  description: string;
  status: string;
  createdAt: Date;
  propertyId: number;
  tenantId: number;
  tenantName: string;
  propertyTitle: string;
}

interface Amenity {
  id: number;
  name: string;
}

interface PropertyRow {
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
  amenities: string; // Will be comma-separated string
}

interface LeaseRow {
  id: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  property: Property;
  tenant: Tenant;
  payments: RentPayment[];
  terms?: string;
}

// const basePropertyQuery = `
//   SELECT p.*, 
//     COALESCE(
//       JSON_ARRAYAGG(
//         JSON_OBJECT('id', a.id, 'name', a.name)
//       ), 
//       JSON_ARRAY()
//     ) AS amenities 
//   FROM properties p
//   LEFT JOIN property_amenities pa ON p.id = pa.propertyId
//   LEFT JOIN amenities a ON pa.amenityId = a.id
// `;

// Updated query to use GROUP_CONCAT instead of JSON_ARRAYAGG
const basePropertyQuery = `
  SELECT p.*, 
  GROUP_CONCAT(a.name) AS amenities 
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

    // Validation remains the same
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

    // SQLite execution
    const stmt = db.prepare(`
      INSERT INTO properties 
      (title, type, category, description, address, price, bedrooms, bathrooms, square_feet, status, image, location, ownerId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
      ownerId
    );

    // Get inserted ID from result
    const insertedId = result.lastInsertRowid;

    // Fetch the created property
    const getStmt = db.prepare("SELECT * FROM properties WHERE id = ?");
    const property = getStmt.get(insertedId) as Property;

    res.status(201).json({
      ...property,
      amenities: "", // Will be empty until amenities are added
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

    // Validation remains the same
    if (
      (minPrice && isNaN(Number(minPrice))) ||
      (maxPrice && isNaN(Number(maxPrice))) ||
      (bedrooms && isNaN(Number(bedrooms))) ||
      (bathrooms && isNaN(Number(bathrooms)))
    ) {
      return next(new ApiError(400, "Invalid parameters"));
    }

    // Add filters
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

    // Execute SQLite query
    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as PropertyRow[];

    // Convert comma-separated amenities to array
    const properties = rows.map((row) => ({
      ...row,
      amenities: row.amenities ? row.amenities.split(",") : [],
    }));

    res.status(200).json(properties);
  } catch (err) {
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

    const query = `${basePropertyQuery} WHERE p.ownerId = ? GROUP BY p.id`;
    const stmt = db.prepare(query);
    const rows = stmt.all(req.user.id) as PropertyRow[];

    const properties = rows.map((row) => ({
      ...row,
      amenities: row.amenities ? row.amenities.split(",") : [],
    }));

    res.status(200).json(properties);
  } catch (err) {
    next(err);
  }
};

export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = `${basePropertyQuery} WHERE p.id = ? GROUP BY p.id`;
    const stmt = db.prepare(query);
    const rows = stmt.all(req.params.id) as PropertyRow[];

    if (rows.length === 0) {
      return next(new ApiError(404, "Property not found"));
    }

    const property = {
      ...rows[0],
      amenities: rows[0].amenities ? rows[0].amenities.split(",") : [],
    };

    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

export const getAmenities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stmt = db.prepare("SELECT * FROM amenities");
    const amenities = stmt.all() as Amenity[];
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
    // Start transaction
    db.exec("BEGIN TRANSACTION");

    // Delete existing amenities
    const deleteStmt = db.prepare(
      "DELETE FROM property_amenities WHERE propertyId = ?"
    );
    deleteStmt.run(id);

    // Insert new amenities
    if (amenities && amenities.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO property_amenities (propertyId, amenityId) 
        VALUES (?, ?)
      `);

      for (const amenityId of amenities) {
        insertStmt.run(id, amenityId);
      }
    }

    // Commit transaction
    db.exec("COMMIT");

    res.status(200).json({ message: "OK" });
  } catch (err) {
    db.exec("ROLLBACK");
    next(err);
  }
};

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
    const stmt = db.prepare(query);
    const rows = stmt.all() as PropertyRow[];

    const properties = rows.map((row) => ({
      ...row,
      amenities: row.amenities ? row.amenities.split(",") : [],
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

    // Update property
    const updateStmt = db.prepare(
      `UPDATE properties SET ${setClause} WHERE id = ?`
    );
    updateStmt.run(...values);

    // Get updated property
    const getStmt = db.prepare("SELECT * FROM properties WHERE id = ?");
    const updatedProperty = getStmt.get(id);

    res.status(200).json(updatedProperty);
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

    // Start transaction
    db.exec("BEGIN TRANSACTION");

    // Delete related records
    const deleteAmenities = db.prepare(
      "DELETE FROM property_amenities WHERE propertyId = ?"
    );
    deleteAmenities.run(id);

    const deleteProperty = db.prepare("DELETE FROM properties WHERE id = ?");
    deleteProperty.run(id);

    // Commit transaction
    db.exec("COMMIT");

    res.status(204).send();
  } catch (err) {
    db.exec("ROLLBACK");
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

    const stmt = db.prepare(query);
    const tenants = stmt.all();
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

    const stmt = db.prepare(query);
    const owners = stmt.all();
    res.status(200).json(owners);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
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

    const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    stmt.run(...values);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    // const stmt = db.prepare(`
    //   SELECT 
    //     u.id,
    //     u.username,
    //     u.email,
    //     u.role,
    //     strftime('%Y-%m-%d', u.createdAt) AS createdAt,
    //     COUNT(p.id) as propertyCount 
    //   FROM users u
    //   LEFT JOIN properties p ON u.id = p.ownerId
    //   GROUP BY u.id
    // `);

    // const users = stmt.all();
    const users = db.prepare("SELECT * FROM users").all();
    // console.log(users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users: " + err });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    stmt.run(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user exists
    const checkStmt = db.prepare(
      "SELECT id FROM users WHERE username = ? OR email = ?"
    );
    const existing = checkStmt.all(username, email);

    if (existing.length > 0) {
      throw new ApiError(400, "Username or email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertStmt = db.prepare(
      "INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, ?)"
    );
    const result = insertStmt.run(username, email, hashedPassword, role);

    const getStmt = db.prepare(
      "SELECT id, username, email, role, createdAt FROM users WHERE id = ?"
    );
    const newUser = getStmt.get(result.lastInsertRowid);

    res.status(201).json(newUser);
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
};

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

    const stmt = db.prepare(query);
    const requests = stmt.all(...params);
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

    // Get tenant ID
    const tenantStmt = db.prepare("SELECT id FROM tenant WHERE userId = ?");
    const tenantRow = tenantStmt.get(req.user.id) as Tenant;

    if (!tenantRow) {
      return next(new ApiError(404, "Tenant profile not found"));
    }

    const insertStmt = db.prepare(`
      INSERT INTO maintenancerequests 
      (propertyId, tenantId, description, status)
      VALUES (?, ?, ?, 'pending')
    `);
    insertStmt.run(propertyId, tenantRow.id, description);

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

    const stmt = db.prepare(
      "UPDATE maintenancerequests SET status = ? WHERE id = ?"
    );
    stmt.run(status, id);

    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getDashboardData = async (
  req: Request & { user?: User },
  res: Response
) => {
  try {
    const userId = req.params.userId;
    const userStmt = db.prepare("SELECT role FROM users WHERE id = ?");
    const userRow = userStmt.get(userId) as User;

    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = userRow.role;

    if (userRole === "admin") {
      const properties = db.prepare("SELECT * FROM properties").all();
      const leases = db.prepare("SELECT * FROM leases").all();
      const payments = db.prepare("SELECT * FROM rent_payments").all();
      const requests = db.prepare("SELECT * FROM maintenancerequests").all();
      const users = db.prepare("SELECT * FROM users").all();

      return res.json({ properties, leases, payments, requests, users });
    }

    if (userRole === "owner") {
      const properties = db
        .prepare(
          `
        SELECT * FROM properties WHERE ownerId = ?
      `
        )
        .all(userId);

      const payments = db
        .prepare(
          `
        SELECT rp.* 
        FROM rent_payments rp
        JOIN leases l ON rp.leaseId = l.id
        JOIN properties p ON l.propertyId = p.id
        WHERE p.ownerId = ?
      `
        )
        .all(userId);

      const leases = db
        .prepare(
          `
        SELECT l.* 
        FROM leases l
        WHERE l.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `
        )
        .all(userId);

      const requests = db
        .prepare(
          `
        SELECT mr.* 
        FROM maintenancerequests mr
        WHERE mr.propertyId IN (SELECT id FROM properties WHERE ownerId = ?)
      `
        )
        .all(userId);

      const tenants = db
        .prepare(
          `
        SELECT u.id as tenantId, u.username, u.email, t.propertyId, 
               p.title as propertyTitle, p.address, l.startDate as leaseStart, l.endDate as leaseEnd
        FROM users u
        JOIN tenant t ON u.id = t.userId
        JOIN properties p ON t.propertyId = p.id
        JOIN leases l ON t.id = l.tenantId
        WHERE p.ownerId = ?
      `
        )
        .all(userId);

      return res.json({
        properties,
        payments,
        leases,
        requests,
        tenants,
      });
    }

    if (userRole === "tenant") {
      const tenantStmt = db.prepare(`
        SELECT id FROM tenant WHERE userId = ?
      `);
      const tenantRow = tenantStmt.get(userId) as Tenant;

      if (!tenantRow) {
        return res.status(404).json({ error: "Tenant profile not found" });
      }

      const leases = db
        .prepare(
          `
        SELECT * FROM leases WHERE tenantId = ?
      `
        )
        .all(tenantRow.id);

      const payments = db
        .prepare(
          `
        SELECT * FROM rent_payments WHERE leaseId IN (
          SELECT id FROM leases WHERE tenantId = ?
        )
      `
        )
        .all(tenantRow.id);

      const requests = db
        .prepare(
          `
        SELECT * FROM maintenancerequests WHERE tenantId = ?
      `
        )
        .all(tenantRow.id);

      return res.json({ leases, payments, requests });
    }

    res.status(403).json({ error: "Unauthorized access" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
