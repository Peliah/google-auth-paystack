
import { logger } from "@/lib/winston";
import User from "@/models/user";
import config from "@/config";
import type { Request, Response } from "express";

/**
 * @function getUserById
 * @description Controller to retrieve a user by their ID
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */

const getUser = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-__v').lean().exec();
        if (!user) {
            res.status(404).json({
                code: "UserNotFound",
                message: "User not found"
            });
            return;
        }
        res.status(200).json(user);
        logger.info(`User with ID ${userId} fetched successfully`);
    } catch (error) {
        res.status(500).json({
            code: "ServerError",
            message: "Internal Server Error",
            error: error
        });
        logger.error('Error while fetching users', error);
    }
}

export default getUser;