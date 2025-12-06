import type { Request, Response } from 'express';

/**
 * 404 Not Found handler
 * Must be registered AFTER all routes but BEFORE error handler
 */
const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        code: 'NotFound',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

export default notFound;

