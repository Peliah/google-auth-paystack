import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { logger } from "@/lib/winston";
import config from "@/config";
import User from "@/models/user";
import Token from "@/models/token";
import type { Request, Response } from "express";
import type { IUser } from "@/models/user";

type UserData = Pick<IUser, 'email' | 'password'>;

const login = async (req: Request, res: Response): Promise<void> => {
    console.log(req.body)
    try {
        const { email } = req.body as UserData;
        const user = await User.findOne({ email })
            .select("username email password role")
            .lean()
            .exec();
        if (!user) {
            res.status(404).json({
                code: "UserNotFoundError",
                message: "User not found with the provided email.",
            });
            logger.warn(`Login attempt with non-existing email: ${email}`);
            return;
        }

        // generate a JWT token for the user
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // store the refresh token in the database
        await Token.create({ token: refreshToken, userId: user._id });
        logger.info(`Refresh token created for user ${user._id}`, { refreshToken });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(201).json({
            user: user,
            accessToken,
        });
        logger.info(`User logged in successfully`, user);
    } catch (error) {
        res.status(500).json({ code: "Server error", message: "Internal server error: " + error });
        logger.error("Error during user login:", error);
    }
}

export default login;