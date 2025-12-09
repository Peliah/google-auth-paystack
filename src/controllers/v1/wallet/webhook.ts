import type { Request, Response } from 'express';
import config from '@/config';
import Transaction from '@/models/transaction';
import Wallet from '@/models/wallet';
import { logger } from '@/lib/winston';
import crypto from 'crypto';

interface PaystackWebhookEvent {
    event: string;
    data: {
        reference: string;
        status: string;
        amount: number;
        channel: string;
        currency: string;
        paid_at: string;
        metadata?: {
            userId?: string;
            walletId?: string;
            type?: string;
        };
    };
}

const webhookHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-paystack-signature'] as string;

        if (!signature) {
            logger.warn('Webhook received without signature');
            res.status(400).json({ status: false, message: 'Missing signature' });
            return;
        }

        const hash = crypto
            .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (hash !== signature) {
            logger.warn('Invalid webhook signature');
            res.status(401).json({ status: false, message: 'Invalid signature' });
            return;
        }

        const event = req.body as PaystackWebhookEvent;
        logger.info(`Wallet webhook received: ${event.event}`, { reference: event.data.reference });

        if (event.data.metadata?.type !== 'wallet_deposit') {
            res.status(200).json({ status: true });
            return;
        }

        if (event.event === 'charge.success') {
            const { reference, channel, currency, paid_at } = event.data;

            const transaction = await Transaction.findOne({ reference });

            if (!transaction) {
                logger.warn(`Transaction not found for webhook: ${reference}`);
                res.status(200).json({ status: true });
                return;
            }

            if (transaction.status === 'success') {
                logger.info(`Transaction ${reference} already processed, skipping`);
                res.status(200).json({ status: true });
                return;
            }

            const walletId = transaction.metadata?.walletId as string;

            if (!walletId) {
                logger.error(`No walletId in transaction metadata: ${reference}`);
                res.status(200).json({ status: true });
                return;
            }

            const wallet = await Wallet.findById(walletId);

            if (!wallet) {
                logger.error(`Wallet not found: ${walletId}`);
                res.status(200).json({ status: true });
                return;
            }

            wallet.balance += transaction.amount;
            await wallet.save();

            transaction.status = 'success';
            transaction.paymentChannel = channel;
            transaction.currency = currency;
            transaction.paidAt = new Date(paid_at);
            await transaction.save();

            logger.info(`Wallet ${wallet.walletNumber} credited ${transaction.amount} via webhook. Reference: ${reference}`);

        } else if (event.event === 'charge.failed') {
            const { reference } = event.data;

            const transaction = await Transaction.findOne({ reference });

            if (transaction && transaction.status !== 'success') {
                transaction.status = 'failed';
                await transaction.save();
                logger.info(`Deposit failed via webhook: ${reference}`);
            }
        }

        res.status(200).json({ status: true });
    } catch (error) {
        logger.error('Wallet webhook processing error:', error);
        res.status(200).json({ status: true });
    }
};

export default webhookHandler;

