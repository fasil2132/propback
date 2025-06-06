"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const property_seed_data_json_1 = __importDefault(require("./seeds/property-seed-data.json"));
const users_seed_data_json_1 = __importDefault(require("./seeds/users-seed-data.json"));
const amenity_seed_data_json_1 = __importDefault(require("./seeds/amenity-seed-data.json"));
async function seedPropertiesTable() {
    try {
        // Start transaction
        database_1.default.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = database_1.default.prepare(`
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
        database_1.default.exec("COMMIT");
        console.log("✅ Properties Table seeded successfully");
    }
    catch (error) {
        database_1.default.exec("ROLLBACK");
        console.error("❌ Seeding Properties Table failed:", error);
    }
    // finally {
    //   db.close();
    // }
}
async function seedUsersTable() {
    try {
        // Start transaction
        database_1.default.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = database_1.default.prepare(`
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
        database_1.default.exec("COMMIT");
        console.log("✅ User Table seeded successfully");
    }
    catch (error) {
        if (database_1.default) {
            database_1.default.exec("ROLLBACK");
        }
        console.error("❌ Seeding User Table failed:", error);
    }
    finally {
        if (database_1.default)
            database_1.default.close();
    }
}
async function seedAmenitiesTable() {
    try {
        // Start transaction
        database_1.default.exec("BEGIN TRANSACTION");
        // Insert properties
        const stmt = database_1.default.prepare(`
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
        database_1.default.exec("COMMIT");
        console.log("✅ Amenity Table seeded successfully");
    }
    catch (error) {
        database_1.default.exec("ROLLBACK");
        console.error("❌ Seeding Amenity Table failed:", error);
    }
    finally {
        database_1.default.close();
    }
}
// seedUsersTable();
// seedAmenitiesTable();
// seedPropertiesTable();
