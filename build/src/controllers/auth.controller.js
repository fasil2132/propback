"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.register = exports.login = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import pool from "../config/database";
const database_1 = __importDefault(require("../config/database"));
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 1. Check if user exists
        // const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
        //   email,
        // ]);
        const getStmt = database_1.default.prepare("SELECT * FROM users WHERE email = ?");
        const user = getStmt.get(email);
        console.log("User: ", user);
        // console.log(users);
        // const user = (users as any[])[0];
        if (!user) {
            throw new apiError_1.default(401, "Invalid  User");
        }
        // console.log(password);
        // console.log(user.passwordHash);
        // console.log("Line before isMatch");
        // 2. Validate password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        // console.log("Line after isMatch");
        if (!isMatch) {
            throw new apiError_1.default(401, "Invalid credentials");
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new apiError_1.default(500, "JWT secret not configured");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: "1d" });
        // // 3. Generate JWT token
        // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        //   expiresIn: "1h",
        // });
        res.status(200).json({ token: token, user: user });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // // 1. Check if user exists
        // const [existing] = await pool.execute(
        //   "SELECT id FROM users WHERE email = ?",
        //   [email]
        // );
        const getStmt = database_1.default.prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        const existing = getStmt.get(email);
        // if ((existing as any[]).length > 0) {
        //   throw new ApiError(400, "User already exists");
        // }
        if (existing > 0) {
            throw new apiError_1.default(400, "User already exists");
        }
        // 1. Check if user exists
        // const [rows] = await pool.execute<RowDataPacket[]>(
        //   "SELECT id FROM users WHERE email = ?", [email]
        // );
        // console.log('Query results:', rows);
        // if (rows.length > 0) {
        //   throw new ApiError(400, "User already exists");
        // }
        // 2. Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // 3. Create user
        // const [result] = await pool.execute(
        //   "INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)",
        //   [username, email, hashedPassword]
        // );
        const stmt = database_1.default.prepare(`
      INSERT INTO users
      (username, email, passwordHash)
      VALUES (?, ?, ?)
      `);
        const result = stmt.run(username, email, hashedPassword);
        res.status(201).json({ message: "User created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const validateToken = async (req, res, next) => {
    try {
        // 1. Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            throw new apiError_1.default(401, "Unauthorized: No token provided");
        }
        const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
        // 2. Verify token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new apiError_1.default(500, "JWT secret not configured");
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // 3. Check if user still exists
        // const [users] = await pool.execute<RowDataPacket[]>(
        //   "SELECT id, email FROM users WHERE id = ?",
        //   [decoded.userId]
        // );
        const getStmt = database_1.default.prepare("SELECT id, email FROM users WHERE id = ?");
        const user = getStmt.get(decoded.userId);
        // const user = users[0];
        if (!user) {
            throw new apiError_1.default(401, "User not found");
        }
        // 4. Return user data (excluding password)
        res.status(200).json({ user });
    }
    catch (err) {
        next(err);
    }
};
exports.validateToken = validateToken;
