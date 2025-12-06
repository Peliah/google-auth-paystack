import { logger } from "@/lib/winston";
import config from "@/config";
import User from "@/models/user";
import type { IUser } from "@/models/user";
import type { Request, Response } from "express";
import { generateUserName } from "@/utils";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import Token from "@/models/token";

type UserData = Pick<IUser, 'email' | 'password' | 'role' | 'phone'>;

const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, phone, role } = req.body as UserData;

    // if (role === 'admin') {
    //     res.status(403).json({
    //         code: "AuthorizationError",
    //         message: "You are not allowed to register as an admin.",
    //     });
    //     logger.warn(`Unauthorized admin registration attempt by ${email}`);
    //     return;
    // }

    try {
        const username = generateUserName();
        const newUser = await User.create({
            username,
            email,
            password,
            phone,
            role,
        });

        // generate a JWT token for the user
        const accessToken = generateAccessToken(newUser._id, newUser.role);
        const refreshToken = generateRefreshToken(newUser._id, newUser.role);

        // store the refresh token in the database
        await Token.create({
            token: refreshToken,
            userId: newUser._id,
        });
        logger.info(`Refresh token created for user ${newUser._id}`, { refreshToken });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(201).json({
            user: {
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                userId: newUser._id.toString(),

            },
            accessToken,
        });
        logger.info(`User registered successfully`, newUser);
    } catch (error) {
        res.status(500).json({ code: "Server error", message: "Internal server error: " + error });
        logger.error("Error during registration: ", error);
    }
}

export default register;