import jwt from "jsonwebtoken";
import config from "@/config";

import { Types } from "mongoose";

export const generateAccessToken = (userId: Types.ObjectId, role: 'admin' | 'user'): string => {
    if (!config.JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET is not defined in the environment variables");
    }

    return jwt.sign({ userId, role }, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRY, subject: "accessApi" });
};

export const generateRefreshToken = (userId: Types.ObjectId, role: 'admin' | 'user'): string => {
    if (!config.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined in the environment variables");
    }

    return jwt.sign({ userId, role }, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_TOKEN_EXPIRY, subject: "refreshToken " });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, config.JWT_ACCESS_SECRET)
}

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, config.JWT_REFRESH_SECRET)
}