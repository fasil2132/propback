// // src/config/database.ts
// import mysql from 'mysql2/promise';

// // Verify environment variables exist
// // if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
// //   throw new Error('Missing database configuration in .env file');
// // }

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   // password: process.env.DB_PASSWORD || '', // Fallback to empty string if missing
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// export default pool;

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing ${varName} in environment variables`);
  }
});

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '', // Fallback for empty password
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // WAMP-specific configuration
  // socketPath: process.env.DB_SOCKET_PATH || undefined
});

export default pool;