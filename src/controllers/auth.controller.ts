// import { Request, Response, NextFunction } from "express";
import { Request, Response, NextFunction } from 'express-serve-static-core';
import ApiError from "../utils/apiError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    // console.log(users);
    const user = (users as any[])[0];
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // console.log(password);
    // console.log(user.passwordHash);

    // console.log("Line before isMatch");
    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    // console.log("Line after isMatch");

    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ApiError(500, "JWT secret not configured");
    }
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "1d" });
    // // 3. Generate JWT token
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    //   expiresIn: "1h",
    // });

    res.status(200).json({ "token":token, "user":user });
  } catch (err) {
    next(err);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password } = req.body;

    // // 1. Check if user exists
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if ((existing as any[]).length > 0) {
      throw new ApiError(400, "User already exists");
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
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create user
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    next(err);
  }
};

export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    // 2. Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ApiError(500, "JWT secret not configured");
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: number };

    // 3. Check if user still exists
    const [users] = await pool.execute<RowDataPacket[]>(
      "SELECT id, email FROM users WHERE id = ?",
      [decoded.userId]
    );
    const user = users[0];
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // 4. Return user data (excluding password)
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
