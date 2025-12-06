import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";
/**
 * @function getCurrentUser
 * @description Controller to update the current authenticated user's details
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */
const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        balance,
        profilePicture,
        bio,
    } = req.body;
    try {
        const user = await User.findById(userId).select('+password -__v').exec();
        if (!user) {
            res.status(404).json({
                code: "UserNotFound",
                message: "User not found"
            });
            return;
        }
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = password;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (profilePicture) user.profilePicture = profilePicture;
        if (bio) user.bio = bio;
        await user.save();

        res.status(200).json({ user });
        logger.info('Current user details updated successfully', { userId });
    } catch (error) {
        res.status(500).json({
            code: "ServerError",
            message: "Internal Server Error",
            error: error
        });
        logger.error('Error while updating current user', error);
    }
}
export default updateCurrentUser;