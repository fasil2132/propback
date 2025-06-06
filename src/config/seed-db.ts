import db from "./database";
import properties from "./seeds/property-seed-data.json";
import users from "./seeds/users-seed-data.json";
import amenities from "./seeds/amenity-seed-data.json";

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

    for (const property of properties) {
      stmt.run(
        property.title,
        property.type,
        property.category,
        property.description,
        property.address,
        property.price,
        property.bedrooms,
        property.bathrooms,
        property.square_feet,
        property.status,
        property.image,
        property.location,
        property.ownerId
      );
    }

    // Commit transaction
    db.exec("COMMIT");
    console.log("✅ Properties Table seeded successfully");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("❌ Seeding Properties Table failed:", error);
  } 
  // finally {
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

    for (const user of users) {
      stmt.run(user.username, user.passwordHash, user.email, user.role);
    }

    // Commit transaction
    db.exec("COMMIT");
    console.log("✅ User Table seeded successfully");
  } catch (error) {
    if (db) {
      db.exec("ROLLBACK");
    }
    console.error("❌ Seeding User Table failed:", error);
  } finally {
    if (db) db.close();
  }
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

    for (const amenity of amenities) {
      stmt.run(amenity.name);
    }

    // Commit transaction
    db.exec("COMMIT");
    console.log("✅ Amenity Table seeded successfully");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("❌ Seeding Amenity Table failed:", error);
  } finally {
    db.close();
  }
}

// seedUsersTable();
// seedAmenitiesTable();
// seedPropertiesTable();
