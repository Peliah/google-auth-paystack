import { Router } from 'express';
import { body, param } from 'express-validator';
import initiatePayment from '@/controllers/v1/payments/initiate';
import verifyPayment from '@/controllers/v1/payments/verify';
import webhook from '@/controllers/v1/payments/webhook';
import authenticate from '@/middleware/authenticate';
import validationError from '@/middleware/validationError';

const router = Router();

/**
 * @openapi
 * /api/v1/payments/initiate:
 *   post:
 *     summary: Initialize a payment
 *     description: Creates a new payment transaction and returns Paystack checkout URL
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - amount
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *               amount:
 *                 type: number
 *                 description: Amount in Naira
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the transaction
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     authorization_url:
 *                       type: string
 *                     access_code:
 *                       type: string
 *       400:
 *         description: Invalid request or payment initialization failed
 *       401:
 *         description: User not authenticated
 */
router.post(
    '/initiate',
    authenticate,
    body('email').isEmail().withMessage('Valid email is required'),
    body('amount').isNumeric().withMessage('Amount must be a number').custom((value) => {
        if (value <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        return true;
    }),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    validationError,
    initiatePayment
);

/**
 * @openapi
 * /api/v1/payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment
 *     description: Checks the status of a payment transaction
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [pending, success, failed, abandoned]
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                     paymentChannel:
 *                       type: string
 *       404:
 *         description: Transaction not found
 */
router.get(
    '/verify/:reference',
    param('reference').notEmpty().withMessage('Reference is required'),
    validationError,
    verifyPayment
);

/**
 * @openapi
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     description: Receives payment notifications from Paystack (do not call directly)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook', webhook);

export default router;

