import { logger } from "@/lib/winston";
import User from "@/models/user";
import config from "@/config";
import type { Request, Response } from "express";

/**
 * @function getAllUsers
 * @description Controller to retrieve all users in the system
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */

const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;

    try {
        const limit = parseInt(req.query.limit as string) ?? config.defaultResLimit;
        const offset = parseInt(req.query.offset as string) ?? config.defaultResOffset;
        const total = await User.countDocuments();
        const users = await User.find({ _id: { $ne: userId } })
            .select('-__v')
            .limit(limit)
            .skip(offset)
            .lean()
            .exec();
        res.status(200).json({
            total,
            limit,
            offset,
            users
        });
        logger.info('Users fetched successfully');
    } catch (error) {
        res.status(500).json({
            code: "ServerError",
            message: "Internal Server Error",
            error: error
        });
        logger.error('Error while fetching users', error);
    }
}
export default getAllUsers;