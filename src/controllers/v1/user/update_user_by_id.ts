import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";
/**
 * @function updateUser
 * @description Controller to update a user by their ID
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send updated user details
 * 
 * @returns {void}
 */

const updateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const {
        username,
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
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
        if (role) user.role = role;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        if (profilePicture) user.profilePicture = profilePicture;
        if (bio) user.bio = bio;

        await user.save();

        res.status(200).json({ user });
        logger.info('User details updated successfully', { userId });
    } catch (error) {
        logger.error(`Error updating user: ${error}`);
        res.status(500).json({
            code: "InternalServerError",
            message: "An error occurred while updating the user account"
        });
    }
}
export default updateUser;