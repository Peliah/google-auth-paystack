import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "@/lib/jwt";
import { logger } from "@/lib/winston";
import User from '@/models/user';
import type { Request, Response, NextFunction } from "express";
import type { Types } from "mongoose";

/**
 * @function authenticate
 * @description Middleware to verify the user's access token from the Auhorization header
 *              if the token is valid, then the user's ID is attached to the request object,
 *              Otherwise, it returns an appropriate error response
 * 
 * @param {Request} req - Express request object. Expects a bearer token in the Authorization header
 * @param {Response} res - Express response object used to send error response if authenticatin fails
 * @param {NextFunction} next - Express next function to pass controll to the next middleware
 * 
 * @returns {void}
 */
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization
    console.log(authHeader);
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            code: "AuthenticationError",
            message: "Access denied, no token provided"
        })
        return;
    }
    const [_, token] = authHeader.split(' ');
    try {
        const jwtPayload = verifyAccessToken(token) as { userId?: Types.ObjectId; role?: 'admin' | 'user' };
        if (!jwtPayload || !jwtPayload.userId || !jwtPayload.role) {
            res.status(401).json({
                code: "AuthenticationError",
                message: "Access denied, invalid token payload"
            })
            return;
        }
        req.userId = jwtPayload.userId as Types.ObjectId;
        return next();
    } catch (error) {
        // Handle expired token
        if (error instanceof TokenExpiredError) {
            res.status(401).json({
                code: "AuthenticationError",
                message: "Access denied, expired token"
            })
            return;
        }
        if (error instanceof JsonWebTokenError) {
            res.status(401).json({
                code: "AuthenticationError",
                message: "Access denied, invalid token"
            })
            return;
        }

        res.status(500).json({
            code: "ServerError",
            message: "Internal Server Error",
            error: error
        })
        logger.error('Error during authentication ', error)
    }
}

export async function authenticateSocket(socket: any, next: NextFunction) {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
        const jwtPayload = verifyAccessToken(token) as { userId: Types.ObjectId };
        socket.user = await User.findById(jwtPayload.userId);
        if (!socket.user) throw new Error('User not found');
        next();
    } catch (error) {
        logger.error('Error during authentication ', error)
        next(error);
    }
}

export default authenticate;