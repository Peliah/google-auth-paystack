import type { Request, Response } from 'express';
import config from '@/config';
import Transaction from '@/models/transaction';
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
        metadata?: Record<string, unknown>;
    };
}

const webhook = async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-paystack-signature'] as string;

        if (!signature) {
            logger.warn('Webhook received without signature');
            res.status(400).json({ message: 'Missing signature' });
            return;
        }

        // Create hash from request body using secret key
        const hash = crypto
            .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');

        // Compare signatures
        if (hash !== signature) {
            logger.warn('Invalid webhook signature');
            res.status(401).json({ message: 'Invalid signature' });
            return;
        }

        const event = req.body as PaystackWebhookEvent;
        logger.info(`Webhook received: ${event.event}`, { reference: event.data.reference });

        // Handle different event types
        if (event.event === 'charge.success') {
            const { reference, status, channel, currency, paid_at } = event.data;

            // Update transaction in database
            const transaction = await Transaction.findOne({ reference });

            if (transaction) {
                transaction.status = 'success';
                transaction.paymentChannel = channel;
                transaction.currency = currency;
                transaction.paidAt = new Date(paid_at);
                await transaction.save();

                logger.info(`Payment successful via webhook: ${reference}`);
            } else {
                logger.warn(`Transaction not found for webhook: ${reference}`);
            }
        } else if (event.event === 'charge.failed') {
            const { reference } = event.data;

            const transaction = await Transaction.findOne({ reference });

            if (transaction) {
                transaction.status = 'failed';
                await transaction.save();

                logger.info(`Payment failed via webhook: ${reference}`);
            }
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
        logger.error('Webhook processing error:', error);
        // Still return 200 to prevent Paystack from retrying
        res.status(200).json({ message: 'Webhook received' });
    }
};

export default webhook;

