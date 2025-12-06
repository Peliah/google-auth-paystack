import { Router } from "express";
import { body, cookie } from "express-validator";
import User from "@/models/user";
import register from "@/controllers/v1/auth/register";
import refreshToken from "@/controllers/v1/auth/refresh_token";
import login from "@/controllers/v1/auth/login";
import logout from "@/controllers/v1/auth/logout";
import authenticate from "@/middleware/authenticate";
import bcrypt from 'bcrypt'
import validationError from "@/middleware/validationError";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered user
 */
router.post(
    '/register',
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').custom(async (value) => {
        const existingUser = await User.exists({ email: value });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        return true;
    }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').notEmpty().withMessage('Password is required'),
    body('role').optional().isIn(['user', 'admin']).isString().withMessage('Role must be either user or admin'),
    body('phone').isString().withMessage('Phone number must be a string').isLength({ min: 9, max: 9 }).custom(async (value) => {
        const existingUser = await User.exists({ phone: value });
        if (existingUser) {
            throw new Error('Phone number already in use');
        }
        return true;
    }),
    validationError,
    register
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully logged in user
 */
router.post(
    '/login',
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').custom(async (value) => {
        const existingUser = await User.exists({ email: value });
        if (!existingUser) {
            throw new Error('User does not exist');
        }
    }),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').custom(async (value, { req }) => {
        const user = await User.findOne({ email: req.body.email }).select('password').lean().exec();
        if (!user) {
            throw new Error('User email or password does not exist');
        }
        const passwordMatch = await bcrypt.compare(value, user.password);
        if (!passwordMatch) {
            throw new Error('User email or password is invalid');
        }
    }),
    validationError,
    login
);

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh user access token
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully refreshed access token
 */
router.post(
    '/refresh-token',
    cookie('refreshToken')
        .exists().withMessage('Refresh token is required')
        .notEmpty().withMessage('Refresh token is required')
        .isJWT().withMessage('Invalid refresh token'),
    validationError,
    refreshToken
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out user
 */
router.post(
    '/logout',
    authenticate,
    logout
)

export default router;