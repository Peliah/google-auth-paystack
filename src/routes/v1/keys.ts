import { Router } from 'express';
import { body } from 'express-validator';
import createKey from '@/controllers/v1/keys/create';
import rolloverKey from '@/controllers/v1/keys/rollover';
import authenticate from '@/middleware/authenticate';
import validationError from '@/middleware/validationError';

const router = Router();

/**
 * @openapi
 * /api/v1/keys/create:
 *   post:
 *     summary: Create a new API key
 *     description: Generate a new API key with specific permissions and expiry. Maximum 5 active keys per user.
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *               - expiry
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the API key
 *                 example: wallet-service
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [deposit, transfer, read]
 *                 description: Permissions for the API key
 *                 example: ["deposit", "transfer", "read"]
 *               expiry:
 *                 type: string
 *                 enum: [1H, 1D, 1M, 1Y]
 *                 description: Expiry duration (Hour, Day, Month, Year)
 *                 example: 1D
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api_key:
 *                   type: string
 *                   description: The generated API key (only shown once)
 *                   example: sk_live_abc123...
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   description: When the key expires
 *                   example: 2025-01-01T12:00:00Z
 *       400:
 *         description: Invalid request, invalid permissions, invalid expiry, or max keys reached
 *       401:
 *         description: User not authenticated
 */
router.post(
    '/create',
    authenticate,
    body('name')
        .isString().withMessage('Name must be a string')
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name must be less than 50 characters'),
    body('permissions')
        .isArray({ min: 1 }).withMessage('Permissions must be a non-empty array'),
    body('expiry')
        .isString().withMessage('Expiry must be a string')
        .notEmpty().withMessage('Expiry is required'),
    validationError,
    createKey
);

/**
 * @openapi
 * /api/v1/keys/rollover:
 *   post:
 *     summary: Rollover an expired API key
 *     description: Create a new API key using the same permissions as an expired key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expired_key_id
 *               - expiry
 *             properties:
 *               expired_key_id:
 *                 type: string
 *                 description: ID of the expired API key
 *                 example: FGH2485K6KK79GKG9GKGK
 *               expiry:
 *                 type: string
 *                 enum: [1H, 1D, 1M, 1Y]
 *                 description: Expiry duration for the new key
 *                 example: 1M
 *     responses:
 *       201:
 *         description: API key rolled over successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api_key:
 *                   type: string
 *                   description: The new generated API key (only shown once)
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   description: When the new key expires
 *       400:
 *         description: Key not expired, invalid expiry, or max keys reached
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Expired key not found
 */
router.post(
    '/rollover',
    authenticate,
    body('expired_key_id')
        .isString().withMessage('Expired key ID must be a string')
        .notEmpty().withMessage('Expired key ID is required'),
    body('expiry')
        .isString().withMessage('Expiry must be a string')
        .notEmpty().withMessage('Expiry is required'),
    validationError,
    rolloverKey
);

export default router;

