"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.authorizeRoles = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
// Authorization middleware (add this to auth.middleware.ts)
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new apiError_1.default(403, "Unauthorized access"));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return next(new apiError_1.default(401, "Access denied"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Explicitly type the query result
        // const [users] = await pool.execute<RowDataPacket[]>(
        //   "SELECT id, username, email, role FROM users WHERE id = ?",
        //   [decoded.userId]
        // );
        const stmt = database_1.default.prepare("SELECT id, username, email, role FROM users WHERE id = ?");
        const user = stmt.get(decoded.userId);
        // console.log("Decoded token:", decoded);
        // console.log("Database query result:", users);
        if (!user) {
            return next(new apiError_1.default(404, "User not found"));
        }
        // Type assertion for the user object
        req.user = user;
        next();
    }
    catch (err) {
        next(new apiError_1.default(401, "Invalid token"));
    }
};
exports.authenticate = authenticate;
