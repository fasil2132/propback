// import { Request, Response, NextFunction } from "express";
import { Request, Response, NextFunction } from 'express-serve-static-core';
import ApiError from "../utils/apiError";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { User } from "../types/user";
import db from '../config/database';

// Authorization middleware (add this to auth.middleware.ts)
export const authorizeRoles = (roles: string[]) => {
  return (req: Request & { user?: User }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Unauthorized access"));
    }
    next();
  };
};

export const authenticate = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next(new ApiError(401, "Access denied"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Explicitly type the query result
    // const [users] = await pool.execute<RowDataPacket[]>(
    //   "SELECT id, username, email, role FROM users WHERE id = ?",
    //   [decoded.userId]
    // );
    const stmt = db.prepare("SELECT id, username, email, role FROM users WHERE id = ?");
    const user = stmt.get(decoded.userId);

    // console.log("Decoded token:", decoded);
    // console.log("Database query result:", users);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Type assertion for the user object
    req.user = user as User;
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid token"));
  }
};
