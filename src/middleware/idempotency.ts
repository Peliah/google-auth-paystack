import type { Request, Response, NextFunction } from 'express';
import IdempotencyKey from '@/models/idempotency';
import { logger } from '@/lib/winston';

const IDEMPOTENCY_TTL_HOURS = 24; // Keys expire after 24 hours

/**
 * Idempotency middleware
 * Prevents duplicate operations by caching responses for the same idempotency key
 * 
 * Usage: Add header `Idempotency-Key: <unique-key>` to requests
 */
const idempotency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // If no idempotency key provided, proceed normally
    if (!idempotencyKey) {
        return next();
    }

    const userId = req.userId?.toString() || 'anonymous';

    try {
        // Check for existing response
        const existing = await IdempotencyKey.findOne({
            key: idempotencyKey,
            userId,
        });

        if (existing) {
            logger.info(`Idempotency key hit: ${idempotencyKey}`);
            res.status(existing.statusCode).json(existing.response);
            return;
        }

        // Store original res.json to intercept the response
        const originalJson = res.json.bind(res);

        res.json = (body: any) => {
            // Save response for future identical requests
            IdempotencyKey.create({
                key: idempotencyKey,
                userId,
                response: body,
                statusCode: res.statusCode,
                expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000),
            }).catch((err) => {
                // Log but don't fail the request
                logger.error('Failed to save idempotency key:', err);
            });

            return originalJson(body);
        };

        next();
    } catch (error) {
        logger.error('Idempotency middleware error:', error);
        // On error, proceed without idempotency
        next();
    }
};

export default idempotency;

