import { Router } from "express";
import { param, query, body } from "express-validator";
import User from "@/models/user";

import authenticate from "@/middleware/authenticate";
import validationError from "@/middleware/validationError";
import authorize from "@/middleware/authorize";
import getCurrentUser from "@/controllers/v1/user/get_current_user";
import updateCurrentUser from "@/controllers/v1/user/update_current_user";
import deleteCurrentUser from "@/controllers/v1/user/delete_current_user";
import getAllUsers from "@/controllers/v1/user/get_all_users";
import getUser from "@/controllers/v1/user/get_user_by_id";
import updateUser from "@/controllers/v1/user/update_user_by_id";
import deleteUser from "@/controllers/v1/user/delete_user_by_id";
import swagger from "@/config/swagger";
import { createUser } from "@/controllers/v1/user/create_user";
const router = Router();

/** 
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user details
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string   
 *                     role:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     profile_picture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     balance:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                code:
 *                  type: number
 *                message:
 *                  type: string
 */
router.get('/me',
    authenticate,
    authorize(['user', 'admin']),
    getCurrentUser
);

/** 
 * @openapi
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user details
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string   
 *                     role:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     profile_picture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     balance:
 *                       type: number
 */
router.put('/me',
    authenticate,
    authorize(['user', 'admin']),
    body('username').optional().isString().isLength({ max: 20 }).withMessage('Username must be a string and less than 20 characters').custom(async (value) => {
        const userExists = await User.findOne({ username: value });
        if (userExists) {
            throw new Error('Username is already in use');
        }
    }),
    body('email').optional().isEmail().withMessage('Email must be a valid email address').custom(async (value) => {
        const userExists = await User.findOne({ email: value });
        if (userExists) {
            throw new Error('Email already exists');
        }
    }),
    body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body(['first_name', 'last_name']).optional().isString().withMessage('Name must be  less than 50 characters').isLength({ max: 50 }),
    body('phone').optional().isString().withMessage('Phone number must be a string').isLength({ min: 9, max: 9 }).custom(async (value) => {
        const userExists = await User.findOne({ phone: value });
        if (userExists) {
            throw new Error('Phone number already in use');
        }
    }),
    body('profile_picture').optional().isString().withMessage('Profile picture must be a string'),
    body('bio').optional().isString().withMessage('Bio must be a string').isLength({ max: 1000 }),
    validationError,
    updateCurrentUser,
);

/** 
 * @openapi
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete current user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Successfully deleted current user
 *       401:
 *         description: Unauthorized
 */
router.delete('/me',
    authenticate,
    authorize(['user', 'admin']),
    deleteCurrentUser
);


/** 
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 */
router.get('/',
    authenticate,
    authorize(['admin']),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be a positive integer'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Page must be a positive integer'),
    validationError,
    getAllUsers
);


/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string   
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 */
router.get('/:id',
    authenticate,
    authorize(['admin', 'user']),
    param('id').notEmpty().isMongoId().withMessage('Invalid user ID format'),
    validationError,
    getUser,
);


/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string   
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email: 
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated user
 */
router.put('/:id',
    authenticate,
    authorize(['admin']),
    param('id').notEmpty().isMongoId().withMessage('Invalid user ID format'),
    body('username').optional().isString().isLength({ max: 20 }).withMessage('Username must be a string and less than 20 characters').custom(async (value, { req }) => {
        const userExists = await User.findOne({ username: value, _id: { $ne: req.params!.id } });
        if (userExists) {
            throw new Error('Username is already in use');
        }
    }),
    body('email').optional().isEmail().withMessage('Email must be a valid email address').custom(async (value, { req }) => {
        const userExists = await User.findOne({ email: value, _id: { $ne: req.params!.id } });
        if (userExists) {
            throw new Error('Email already exists');
        }
    }),
    body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
    body(['first_name', 'last_name']).optional().isString().withMessage('Name must be  less than 50 characters').isLength({ max: 50 }),
    validationError,
    updateUser,
);


/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string   
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully deleted user
 */
router.delete('/:id',
    authenticate,
    authorize(['admin']),
    param('id').notEmpty().isMongoId().withMessage('Invalid user ID format'),
    validationError,
    deleteUser,
);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email: 
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully created user
 */
router.post('/',
    authenticate,
    authorize(['admin']),
    body('username').isString().isLength({ max: 20 }).withMessage('Username must be a string and less than 20 characters').custom(async (value) => {
        const userExists = await User.findOne({ username: value });
        if (userExists) {
            throw new Error('Username is already in use');
        }
    }),
    body('email').isEmail().withMessage('Email must be a valid email address').custom(async (value) => {
        const userExists = await User.findOne({ email: value });
        if (userExists) {
            throw new Error('Email already exists');
        }
    }),
    body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
    body('phone').isString().withMessage('Phone number must be a string').isLength({ min: 9, max: 9 }).custom(async (value) => {
        const userExists = await User.findOne({ phone: value });
        if (userExists) {
            throw new Error('Phone number already in use');
        }
    }),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body(['first_name', 'last_name']).isString().isLength({ max: 50 }).withMessage('Name must be  less than 50 characters').optional(),
    validationError,
    createUser
)

export default router;