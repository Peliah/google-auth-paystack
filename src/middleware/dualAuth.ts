import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "@/lib/jwt";
import { logger } from "@/lib/winston";
import ApiKey, { hashApiKey, type ApiKeyPermission } from '@/models/apiKey';
import type { Request, Response, NextFunction } from "express";
import type { Types } from "mongoose";

/**
 * Dual authentication middleware
 * Supports both JWT (Bearer token) and API key (x-api-key header)
 * 
 * JWT: Authorization: Bearer <token>
 * API Key: x-api-key: <key>
 */
const dualAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

    // Try JWT authentication first
    if (authHeader?.startsWith('Bearer ')) {
        const [_, token] = authHeader.split(' ');
        try {
            const jwtPayload = verifyAccessToken(token) as { userId?: Types.ObjectId; role?: 'admin' | 'user' };
            if (!jwtPayload || !jwtPayload.userId || !jwtPayload.role) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, invalid token payload"
                });
                return;
            }
            req.userId = jwtPayload.userId as Types.ObjectId;
            req.authType = 'jwt';
            return next();
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, expired token"
                });
                return;
            }
            if (error instanceof JsonWebTokenError) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, invalid token"
                });
                return;
            }
            res.status(500).json({
                code: "ServerError",
                message: "Internal Server Error"
            });
            logger.error('Error during JWT authentication', error);
            return;
        }
    }

    // Try API key authentication
    if (apiKeyHeader) {
        try {
            const keyHash = hashApiKey(apiKeyHeader);

            const apiKey = await ApiKey.findOne({ keyHash });

            if (!apiKey) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, invalid API key"
                });
                return;
            }

            if (apiKey.revoked) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, API key has been revoked"
                });
                return;
            }

            if (apiKey.expiresAt < new Date()) {
                res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, API key has expired"
                });
                return;
            }

            req.userId = apiKey.userId as Types.ObjectId;
            req.authType = 'apikey';
            req.apiKeyPermissions = apiKey.permissions;
            return next();
        } catch (error) {
            res.status(500).json({
                code: "ServerError",
                message: "Internal Server Error"
            });
            logger.error('Error during API key authentication', error);
            return;
        }
    }

    // No authentication provided
    res.status(401).json({
        code: "AuthenticationError",
        message: "Access denied, no authentication provided"
    });
};

/**
 * Factory function to create permission check middleware
 * Use after dualAuth middleware to enforce permissions for API key requests
 * 
 * @param requiredPermission - The permission required for this endpoint
 */
export const requirePermission = (requiredPermission: ApiKeyPermission) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // JWT users have all permissions
        if (req.authType === 'jwt') {
            return next();
        }

        // API key users need specific permissions
        if (req.authType === 'apikey') {
            if (!req.apiKeyPermissions?.includes(requiredPermission)) {
                res.status(403).json({
                    code: "ForbiddenError",
                    message: `Access denied, missing '${requiredPermission}' permission`
                });
                return;
            }
            return next();
        }

        // Should not reach here, but just in case
        res.status(401).json({
            code: "AuthenticationError",
            message: "Access denied, authentication required"
        });
    };
};

export default dualAuth;


