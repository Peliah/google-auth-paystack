import type { Request, Response } from 'express';
import config from '@/config';
import User from '@/models/user';
import Token from '@/models/token';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Redirects user to Google OAuth consent screen
 */
export const googleAuth = (req: Request, res: Response): void => {
    const params = new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        redirect_uri: config.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    res.redirect(authUrl);
};

/**
 * Handles Google OAuth callback
 */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, error } = req.query;

        if (error) {
            logger.error('Google OAuth error:', error);
            res.status(400).json({
                code: 'OAuthError',
                message: `Google OAuth error: ${error}`,
            });
            return;
        }

        if (!code || typeof code !== 'string') {
            res.status(400).json({
                code: 'MissingCode',
                message: 'Authorization code is missing',
            });
            return;
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: config.GOOGLE_CLIENT_ID,
                client_secret: config.GOOGLE_CLIENT_SECRET,
                redirect_uri: config.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            logger.error('Failed to exchange code for tokens:', errorData);
            res.status(400).json({
                code: 'TokenExchangeError',
                message: 'Failed to exchange authorization code for tokens',
            });
            return;
        }

        const tokenData = await tokenResponse.json() as {
            access_token: string;
            refresh_token?: string;
            id_token: string;
        };

        // Get user info from Google
        const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userInfoResponse.ok) {
            logger.error('Failed to fetch user info from Google');
            res.status(400).json({
                code: 'UserInfoError',
                message: 'Failed to fetch user information from Google',
            });
            return;
        }

        const googleUser = await userInfoResponse.json() as {
            id: string;
            email: string;
            name: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
        };

        // Find or create user
        let user = await User.findOne({
            $or: [{ googleId: googleUser.id }, { email: googleUser.email }],
        });

        if (user) {
            // Update existing user with Google info if not already set
            if (!user.googleId) {
                user.googleId = googleUser.id;
                user.authProvider = 'google';
                if (googleUser.picture && !user.profilePicture) {
                    user.profilePicture = googleUser.picture;
                }
                await user.save();
            }
        } else {
            // Create new user
            const username = googleUser.email.split('@')[0] + '_' + Date.now().toString(36);
            user = await User.create({
                email: googleUser.email,
                username,
                firstName: googleUser.given_name || '',
                lastName: googleUser.family_name || '',
                profilePicture: googleUser.picture || '',
                googleId: googleUser.id,
                authProvider: 'google',
            });
            logger.info(`New user created via Google OAuth: ${user.email}`);
        }

        // Generate JWT tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Store refresh token
        await Token.create({ token: refreshToken, userId: user._id });

        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        logger.info(`User logged in via Google OAuth: ${user.email}`);

        // Return user data and access token
        res.status(200).json({
            message: 'Google authentication successful',
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                role: user.role,
                authProvider: user.authProvider,
            },
            accessToken,
        });
    } catch (error) {
        logger.error('Google OAuth callback error:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error during Google authentication',
        });
    }
};

