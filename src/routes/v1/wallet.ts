import { Router } from 'express';
import getBalance from '@/controllers/v1/wallet/balance';
import authenticate from '@/middleware/authenticate';

const router = Router();

/**
 * @openapi
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Returns the current balance of the authenticated user's wallet. Creates a wallet if one doesn't exist.
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: Current wallet balance
 *                   example: 15000
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/balance', authenticate, getBalance);

export default router;

