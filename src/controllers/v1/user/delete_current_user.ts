import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";
import logout from "../auth/logout";
/**
 * @function deleteCurrentUser
 * @description Controller to delete the current authenticated user's account
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send confirmation of deletion
 * 
 * @returns {void}
 */
const deleteCurrentUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
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

        res.sendStatus(204).json({
            code: "UserDeleted",
            message: "User account deleted successfully"
        });
        logger.info(`User with ID ${userId} deleted successfully`);
        await logout(req, res); // Call logout to clear tokens and cookies
    } catch (error) {
        logger.error(`Error deleting user: ${error}`);
        res.status(500).json({
            code: "InternalServerError",
            message: "An error occurred while deleting the user account"
        });
    }
};
export default deleteCurrentUser;