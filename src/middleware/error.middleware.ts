// import { Request, Response, NextFunction } from 'express';
import { Request, Response, NextFunction } from 'express-serve-static-core';
import ApiError from '../utils/apiError';

// error.middleware.ts
export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  };
  
