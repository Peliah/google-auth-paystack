import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";

/**
 * @function deleteUser
 * @description Controller to delete a user by their ID
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send deletion status
 * 
 * @returns {void}
 */

const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId).select('-__v').exec();
        if (!user) {
            res.status(404).json({
                code: "UserNotFound",
                message: "User not found"
            });
            return;
        }
        await User.deleteOne({ _id: userId });

        res.status(204).json({
            code: "UserDeleted",
            message: "User account deleted successfully"
        });
        logger.info(`User with ID ${userId} deleted successfully`);
    } catch (error) {
        logger.error(`Error deleting user: ${error}`);
        res.status(500).json({
            code: "InternalServerError",
            message: "An error occurred while deleting the user account"
        });
    }
};
export default deleteUser;