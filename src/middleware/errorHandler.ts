import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/lib/winston';
import config from '@/config';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number, code: string = 'Error') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Default values
    let statusCode = 500;
    let code = 'ServerError';
    let message = 'Internal server error';

    // Handle known operational errors
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'ValidationError';
        message = err.message;
    }

    // Handle Mongoose duplicate key errors
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        statusCode = 409;
        code = 'DuplicateError';
        message = 'Duplicate entry found';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'AuthenticationError';
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'AuthenticationError';
        message = 'Token expired';
    }

    // Log error
    logger.error(`${code}: ${message}`, {
        error: err.message,
        stack: config.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    // Send response
    res.status(statusCode).json({
        code,
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;

