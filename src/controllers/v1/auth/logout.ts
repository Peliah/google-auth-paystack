import { logger } from "@/lib/winston";
import config from "@/config";
import Token from "@/models/token";
import type { Request, Response } from "express";
import { Types } from "mongoose";

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken as string;
        if (refreshToken) {
            await Token.deleteOne({ token: refreshToken });
            logger.info('User refresh Token deleted Successfully', {
                userId: req.userId,
                token: refreshToken
            });
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.sendStatus(204);
        logger.info('User logged out Successfully', {
            userId: req.userId
        });
    } catch (error) {
        res.status(500).json({ code: "Server error", message: "Internal server error: " + error });
        logger.error("Error during user logout:", error);
    }
}

export default logout;