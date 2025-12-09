import { Router } from 'express';
import { body, param } from 'express-validator';
import getBalance from '@/controllers/v1/wallet/balance';
import deposit from '@/controllers/v1/wallet/deposit';
import webhookHandler from '@/controllers/v1/wallet/webhook';
import getDepositStatus from '@/controllers/v1/wallet/depositStatus';
import transfer from '@/controllers/v1/wallet/transfer';
import getTransactions from '@/controllers/v1/wallet/transactions';
import authenticate from '@/middleware/authenticate';
import validationError from '@/middleware/validationError';

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

/**
 * @openapi
 * /api/v1/wallet/deposit:
 *   post:
 *     summary: Initialize a wallet deposit
 *     description: Creates a new Paystack transaction to deposit funds into the user's wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit in Naira
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Deposit initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   description: Transaction reference
 *                 authorization_url:
 *                   type: string
 *                   description: Paystack payment URL
 *       400:
 *         description: Invalid request or payment initialization failed
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 */
router.post(
    '/deposit',
    authenticate,
    body('amount')
        .isNumeric().withMessage('Amount must be a number')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('Amount must be greater than 0');
            }
            return true;
        }),
    validationError,
    deposit
);

/**
 * @openapi
 * /api/v1/wallet/paystack/webhook:
 *   post:
 *     summary: Paystack webhook for wallet deposits
 *     description: Receives payment notifications from Paystack and credits the wallet on successful payment. Do not call directly.
 *     tags: [Wallet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 */
router.post('/paystack/webhook', webhookHandler);

/**
 * @openapi
 * /api/v1/wallet/deposit/{reference}/status:
 *   get:
 *     summary: Get deposit status
 *     description: Returns the status of a deposit transaction. This endpoint is READ-ONLY and does NOT credit the wallet.
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Deposit status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, success, failed, abandoned]
 *                 amount:
 *                   type: number
 *       400:
 *         description: Missing reference
 *       404:
 *         description: Transaction not found
 */
router.get(
    '/deposit/:reference/status',
    authenticate,
    param('reference').notEmpty().withMessage('Reference is required'),
    validationError,
    getDepositStatus
);

/**
 * @openapi
 * /api/v1/wallet/transfer:
 *   post:
 *     summary: Transfer funds to another wallet
 *     description: Transfer money from your wallet to another user's wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet_number
 *               - amount
 *             properties:
 *               wallet_number:
 *                 type: string
 *                 description: Recipient's wallet number
 *                 example: "4566678954356"
 *               amount:
 *                 type: number
 *                 description: Amount to transfer in Naira
 *                 example: 3000
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Transfer completed
 *       400:
 *         description: Invalid request, insufficient balance, or invalid transfer
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Recipient wallet not found
 */
router.post(
    '/transfer',
    authenticate,
    body('wallet_number')
        .isString().withMessage('Wallet number must be a string')
        .notEmpty().withMessage('Wallet number is required'),
    body('amount')
        .isNumeric().withMessage('Amount must be a number')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('Amount must be greater than 0');
            }
            return true;
        }),
    validationError,
    transfer
);

/**
 * @openapi
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Returns all transactions (deposits and transfers) for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [deposit, transfer]
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [pending, success, failed, abandoned]
 *             example:
 *               - type: deposit
 *                 amount: 5000
 *                 status: success
 *               - type: transfer
 *                 amount: 3000
 *                 status: success
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/transactions', authenticate, getTransactions);

export default router;
