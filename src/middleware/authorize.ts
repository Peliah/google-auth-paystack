import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response, NextFunction } from "express";

/**
 * @function getCurrentUser
 * @description Controller to get the current authenticated user's details
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */

export type AuthRole = 'user' | 'admin';

const authorize = (roles: AuthRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.userId;
        try {
            if (!userId) {
                return res.status(401).json({
                    code: "AuthenticationError",
                    message: "Access denied, no user ID found"
                });
            }

            const user = await User.findById(userId).select('role').lean().exec();
            if (!user) {
                return res.status(404).json({
                    code: "UserNotFound",
                    message: "User not found"
                });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    code: "AuthorizationError",
                    message: "Access denied, insufficient permissions"
                });
            }

            return next();
        } catch (error) {
            logger.error('Error during authorization', error);
            res.status(500).json({
                code: "ServerError",
                message: "Internal Server Error",
                error: error
            });
            logger.error('Error while authorizating user', error);
        }
    };
}

export default authorize;