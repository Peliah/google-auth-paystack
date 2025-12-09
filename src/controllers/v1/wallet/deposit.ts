import type { Request, Response } from 'express';
import config from '@/config';
import Transaction from '@/models/transaction';
import User from '@/models/user';
import { getOrCreateWallet } from '@/services/wallet';
import { logger } from '@/lib/winston';
import crypto from 'crypto';

const PAYSTACK_INIT_URL = 'https://api.paystack.co/transaction/initialize';

interface DepositBody {
    amount: number;
}

const deposit = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount } = req.body as DepositBody;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const user = await User.findById(userId).select('email').lean();
        if (!user) {
            res.status(404).json({
                code: 'UserNotFound',
                message: 'User not found',
            });
            return;
        }

        const wallet = await getOrCreateWallet(userId);

        const email = user.email;
        const reference = `dep_${crypto.randomBytes(16).toString('hex')}`;
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
                    userId: userId.toString(),
                    walletId: wallet._id.toString(),
                    type: 'wallet_deposit',
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
                message: data.message || 'Failed to initialize deposit',
            });
            return;
        }

        await Transaction.create({
            userId,
            type: 'deposit',
            reference,
            amount,
            email,
            status: 'pending',
            metadata: {
                walletId: wallet._id.toString(),
            },
        });

        logger.info(`Wallet deposit initialized: ${reference} for user ${userId}`);

        res.status(200).json({
            reference,
            authorization_url: data.data.authorization_url,
        });
    } catch (error) {
        logger.error('Error initializing wallet deposit:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default deposit;

