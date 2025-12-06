import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";

/**
 * @function createUser
 * @description Controller to create a new user
 * 
 * @param {Request} req - Express request object, expects userId to be set by authenticate middleware
 * @param {Response} res - Express response object used to send user details
 * 
 * @returns {void}
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
        logger.info("User created successfully", { user });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ code: "ServerError", error: "Failed to create user" });
    }
};