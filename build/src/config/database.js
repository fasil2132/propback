"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const property_seed_data_json_1 = __importDefault(require("./seeds/property-seed-data.json"));
const users_seed_data_json_1 = __importDefault(require("./seeds/users-seed-data.json"));
const amenity_seed_data_json_1 = __importDefault(require("./seeds/amenity-seed-data.json"));
const tenant_seed_data_json_1 = __importDefault(require("./seeds/tenant-seed-data.json"));
const leases_seed_data_json_1 = __importDefault(require("./seeds/leases-seed-data.json"));
dotenv_1.default.config();
// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path_1.default.join(__dirname, "../../data/database.sqlite");
// Create and configure SQLite database
const db = new better_sqlite3_1.default(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
});
db.pragma("journal_mode = WAL"); // Better write concurrency
db.pragma("busy_timeout = 5000"); // Set 5s timeout for locked database
// Initialize database schema
function initializeDatabase() {
    try {
        // Enable foreign key support
        db.pragma("foreign_keys = ON");
        // Create tables with SQLite-compatible syntax
        db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('admin', 'owner', 'tenant')) DEFAULT 'tenant',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS amenities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT CHECK(type IN ('rent', 'sale')) DEFAULT 'sale',
        category TEXT CHECK(category IN ('residential', 'commercial', 'industrial')) DEFAULT 'residential',
        description TEXT,
        address TEXT NOT NULL,
        price REAL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        square_feet INTEGER,
        status TEXT CHECK(status IN ('available', 'occupied', 'maintenance')),
        image TEXT NOT NULL DEFAULT 'src/assets/image.webp',
        location TEXT NOT NULL DEFAULT 'Lemi Kura',
        ownerId INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS tenant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE,
        propertyId INTEGER,
        leaseStart DATE,
        leaseEnd DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (propertyId) REFERENCES properties(id)
      );

      CREATE TABLE IF NOT EXISTS leases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propertyId INTEGER NOT NULL,
        tenantId INTEGER NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        monthlyRent REAL NOT NULL,
        securityDeposit REAL,
        document TEXT DEFAULT '/src/assets/images/leases/lease.webp',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (propertyId) REFERENCES properties(id),
        FOREIGN KEY (tenantId) REFERENCES tenant(id)
      );

      CREATE TABLE IF NOT EXISTS maintenancerequests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propertyId INTEGER,
        tenantId INTEGER,
        description TEXT,
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (propertyId) REFERENCES properties(id),
        FOREIGN KEY (tenantId) REFERENCES tenant(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        message TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS property_amenities (
        propertyId INTEGER NOT NULL,
        amenityId INTEGER NOT NULL,
        PRIMARY KEY (propertyId, amenityId),
        FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (amenityId) REFERENCES amenities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS rent_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leaseId INTEGER NOT NULL,
        amount REAL NOT NULL,
        paymentDate DATE NOT NULL,
        method TEXT CHECK(method IN ('telebirr', 'bank_transfer', 'cash')),
        createdDt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leaseId) REFERENCES leases(id)
      );
    `);
        // } catch (error) {
        //   db.exec("ROLLBACK");
        console.log("✅ Database tables initialized successfully");
    }
    catch (error) {
        console.error("❌ Error initializing database:", error);
        throw error;
    }
}
function seedInitialData(users) {
    users.forEach((user) => {
        const userCount = db
            .prepare("SELECT COUNT(*) FROM users WHERE email = ?")
            .get(user.email);
        if (userCount < 1) {
            console.log("Creating user with username: ", user.username);
            const userStmt = db.prepare(`
        INSERT INTO users (username, passwordHash, email, role) 
        VALUES (?, ?, ?, ?)
        `);
            userStmt.run(user.username, user.passwordHash, user.email, user.role);
        }
    });
}
function seedInitialData2(user) {
    console.log("Creating user with username: ", user.username);
    const userStmt = db.prepare(`
        INSERT INTO users (username, passwordHash, email, role) 
        VALUES (?, ?, ?, ?)
        `);
    userStmt.run(user.username, user.passwordHash, user.email, user.role);
}
function seedAmenities(amenityName) {
    console.log("Creating Amenity: ", amenityName);
    const amStmt = db.prepare(`
    INSERT INTO amenities (name) VALUES (?)
    `);
    amStmt.run(amenityName);
}
function backupDatabase() {
    const source = db.name;
    const dest = `${source}.bak-${Date.now()}`;
    fs_1.default.copyFileSync(source, dest);
}
function addUser(user) {
    console.log("Creating user with username: ", user.username);
    const userStmt = db.prepare(`
        INSERT INTO users (username, passwordHash, email, role) 
        VALUES (?, ?, ?, ?)
        `);
    userStmt.run(user.username, user.passwordHash, user.email, user.role);
}
function getUniqueRandomNumbers() {
    const numbers = Array.from({ length: 13 }, (_, i) => i + 1); // Creates an array [1, 2, ..., 13]
    const length = Math.floor(Math.random() * 3) + 2; // Ensures array length is between 2 and 4
    return numbers.sort(() => Math.random() - 0.5).slice(0, length);
}
function deleteAmenities() {
    // Delete existing amenities
    console.log("Deleting all amenities...");
    const deleteStmt = db.prepare("DELETE FROM amenities");
    deleteStmt.run();
}
async function seedPropertiesTable() {
    try {
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO properties (
        title, type, category, description, address, price, 
        bedrooms, bathrooms, square_feet, status, image, location, ownerId
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
        for (const property of property_seed_data_json_1.default) {
            stmt.run(property.title, property.type, property.category, property.description, property.address, property.price, property.bedrooms, property.bathrooms, property.square_feet, property.status, property.image, property.location, property.ownerId);
        }
        // Commit transaction
        db.exec("COMMIT");
        console.log("✅ Properties Table seeded successfully");
    }
    catch (error) {
        db.exec("ROLLBACK");
        console.error("❌ Seeding Properties Table failed:", error);
    }
    //  finally {
    //   db.close();
    // }
}
async function seedUsersTable() {
    try {
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO users (
        username, passwordHash, email, role
      ) VALUES (
        ?, ?, ?, ?
      )
    `);
        for (const user of users_seed_data_json_1.default) {
            stmt.run(user.username, user.passwordHash, user.email, user.role);
        }
        // Commit transaction
        db.exec("COMMIT");
        console.log("✅ User Table seeded successfully");
    }
    catch (error) {
        if (db) {
            db.exec("ROLLBACK");
        }
        console.error("❌ Seeding User Table failed:", error);
    }
    // finally {
    //   if (db) db.close();
    // }
}
async function seedAmenitiesTable() {
    try {
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO amenities (
        name
      ) VALUES (
        ?
      )
    `);
        for (const amenity of amenity_seed_data_json_1.default) {
            stmt.run(amenity.name);
        }
        // Commit transaction
        db.exec("COMMIT");
        console.log("✅ Amenity Table seeded successfully");
    }
    catch (error) {
        db.exec("ROLLBACK");
        console.error("❌ Seeding Amenity Table failed:", error);
    }
    // finally {
    //   db.close();
    // }
}
async function seedPropertyAmenitiesTable() {
    try {
        const pstmt = db.prepare("SELECT * FROM properties");
        const iproperties = pstmt.all();
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO property_amenities (
        propertyId,
        amenityId
      ) VALUES (
        ?, ?
      )
    `);
        for (const property of iproperties) {
            const nums = getUniqueRandomNumbers();
            nums.map((num) => {
                stmt.run(property.id, num);
            });
        }
        db.exec("COMMIT");
        // Commit transaction
        console.log("✅ Property_Amenities Table seeded successfully");
    }
    catch (error) {
        db.exec("ROLLBACK");
        console.error("❌ Seeding Property_Amenities Table failed:", error);
    }
    // finally {
    //   db.close();
    // }
}
async function seedTenantTable() {
    try {
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO tenant (
        userId, propertyId, leaseStart, leaseEnd
      ) VALUES (
        ?, ?, ?, ?
      )
    `);
        for (const tenant of tenant_seed_data_json_1.default) {
            stmt.run(tenant.userId, tenant.propertyId, tenant.leaseStart, tenant.leaseEnd);
        }
        // Commit transaction
        db.exec("COMMIT");
        console.log("✅ Tenant Table seeded successfully");
    }
    catch (error) {
        if (db) {
            db.exec("ROLLBACK");
        }
        console.error("❌ Seeding Tenant Table failed:", error);
    }
    // finally {
    //   if (db) db.close();
    // }
}
async function seedLeasesTable() {
    try {
        // Start transaction
        db.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = db.prepare(`
      INSERT INTO leases (
        propertyId, tenantId, startDate, endDate, monthlyRent, securityDeposit, document
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `);
        for (const lease of leases_seed_data_json_1.default) {
            stmt.run(lease.propertyId, lease.tenantId, lease.startDate, lease.endDate, lease.monthlyRent, lease.securityDeposit, lease.document);
        }
        // Commit transaction
        db.exec("COMMIT");
        console.log("✅ Lease Table seeded successfully");
    }
    catch (error) {
        if (db) {
            db.exec("ROLLBACK");
        }
        console.error("❌ Seeding Lease Table failed:", error);
    }
    // finally {
    //   if (db) db.close();
    // }
}
function deleteAllTableData() {
    const amenities_stmt = db.prepare("DELETE FROM amenities");
    amenities_stmt.run();
    const leases_stmt = db.prepare("DELETE FROM leases");
    leases_stmt.run();
    const tenant_stmt = db.prepare("DELETE FROM tenant");
    tenant_stmt.run();
    const properties_stmt = db.prepare("DELETE FROM properties");
    properties_stmt.run();
    const users_stmt = db.prepare("DELETE FROM users");
    users_stmt.run();
    const amenities_sequence_stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='amenities'");
    amenities_sequence_stmt.run();
    const properties_sequence_stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='properties'");
    properties_sequence_stmt.run();
    const users_sequence_stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='users'");
    users_sequence_stmt.run();
    const leases_sequence_stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='leases'");
    leases_sequence_stmt.run();
    const tenant_sequence_stmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='tenant'");
    tenant_sequence_stmt.run();
}
// Run daily backups
// setInterval(backupDatabase, 24 * 60 * 60 * 1000);
initializeDatabase();
deleteAllTableData();
seedUsersTable();
seedAmenitiesTable();
seedPropertiesTable();
seedPropertyAmenitiesTable();
seedTenantTable();
seedLeasesTable();
exports.default = db;
