import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/lib/winston';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, status, and response time
 */
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { method, originalUrl, ip } = req;
        const { statusCode } = res;

        const logLevel = statusCode >= 400 ? 'warn' : 'info';

        logger[logLevel](`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
            method,
            path: originalUrl,
            statusCode,
            duration,
            ip,
            userAgent: req.get('user-agent'),
        });
    });

    next();
};

export default requestLogger;

