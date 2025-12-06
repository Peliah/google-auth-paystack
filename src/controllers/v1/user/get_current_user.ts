import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";
/**
 * @function getCurrentUser
 * @description Controller to get the current authenticated user's details
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */
const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                code: "AuthenticationError",
                message: "Access denied, no user ID found"
            });
        }

        const user = await User.findById(userId).select('-__v').lean().exec();
        if (!user) {
            res.status(404).json({
                code: "UserNotFound",
                message: "User not found"
            });
        }

        res.status(200).json({ user });
        logger.info('Current user details fetched successfully', { userId });
    } catch (error) {
        res.status(500).json({
            code: "ServerError",
            message: "Internal Server Error",
            error: error
        });
        logger.error('Error while fetching current user', error);
    }
}

export default getCurrentUser;