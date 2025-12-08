import type { Request, Response } from 'express';
import config from '@/config';
import Transaction from '@/models/transaction';
import User from '@/models/user';
import { logger } from '@/lib/winston';
import crypto from 'crypto';

const PAYSTACK_INIT_URL = 'https://api.paystack.co/transaction/initialize';

interface InitiatePaymentBody {
    amount: number; // Amount in Naira (will be converted to kobo)
    metadata?: Record<string, unknown>;
}

const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, metadata } = req.body as InitiatePaymentBody;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        // Get user's email from database
        const user = await User.findById(userId).select('email').lean();
        if (!user) {
            res.status(404).json({
                code: 'UserNotFound',
                message: 'User not found',
            });
            return;
        }
        const email = user.email;

        const reference = `txn_${crypto.randomBytes(16).toString('hex')}`;

        const amountInKobo = Math.round(amount * 100);

        const response = await fetch(PAYSTACK_INIT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountInKobo,
                reference,
                metadata: {
                    ...metadata,
                    userId: userId.toString(),
                },
            }),
        });

        const data = await response.json() as {
            status: boolean;
            message: string;
            data?: {
                authorization_url: string;
                access_code: string;
                reference: string;
            };
        };

        if (!data.status || !data.data) {
            logger.error('Paystack initialization failed:', data.message);
            res.status(400).json({
                code: 'PaymentInitError',
                message: data.message || 'Failed to initialize payment',
            });
            return;
        }

        await Transaction.create({
            userId,
            reference,
            amount,
            email,
            status: 'pending',
            metadata,
        });

        logger.info(`Payment initialized: ${reference} for user ${userId}`);

        res.status(200).json({
            message: 'Payment initialized successfully',
            data: {
                reference,
                authorization_url: data.data.authorization_url,
                access_code: data.data.access_code,
            },
        });
    } catch (error) {
        logger.error('Error initializing payment:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default initiatePayment;

