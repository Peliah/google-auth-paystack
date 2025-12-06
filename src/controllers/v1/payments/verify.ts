import type { Request, Response } from 'express';
import config from '@/config';
import Transaction from '@/models/transaction';
import { logger } from '@/lib/winston';

const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify';

const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reference } = req.params;

        if (!reference) {
            res.status(400).json({
                code: 'MissingReference',
                message: 'Transaction reference is required',
            });
            return;
        }

        // Find transaction in database
        const transaction = await Transaction.findOne({ reference });

        if (!transaction) {
            res.status(404).json({
                code: 'TransactionNotFound',
                message: 'Transaction not found',
            });
            return;
        }

        // If already successful, return cached status
        if (transaction.status === 'success') {
            res.status(200).json({
                message: 'Payment verified',
                data: {
                    reference: transaction.reference,
                    amount: transaction.amount,
                    status: transaction.status,
                    paidAt: transaction.paidAt,
                    paymentChannel: transaction.paymentChannel,
                },
            });
            return;
        }

        // Verify with Paystack
        const response = await fetch(`${PAYSTACK_VERIFY_URL}/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json() as {
            status: boolean;
            message: string;
            data?: {
                status: string;
                reference: string;
                amount: number;
                channel: string;
                paid_at: string;
                currency: string;
            };
        };

        if (!data.status || !data.data) {
            logger.error('Paystack verification failed:', data.message);
            res.status(400).json({
                code: 'VerificationError',
                message: data.message || 'Failed to verify payment',
            });
            return;
        }

        // Update transaction based on Paystack response
        const paystackStatus = data.data.status;
        let transactionStatus: 'pending' | 'success' | 'failed' | 'abandoned' = 'pending';

        if (paystackStatus === 'success') {
            transactionStatus = 'success';
        } else if (paystackStatus === 'failed') {
            transactionStatus = 'failed';
        } else if (paystackStatus === 'abandoned') {
            transactionStatus = 'abandoned';
        }

        // Update transaction in database
        transaction.status = transactionStatus;
        transaction.paymentChannel = data.data.channel;
        transaction.currency = data.data.currency;
        if (transactionStatus === 'success') {
            transaction.paidAt = new Date(data.data.paid_at);
        }
        await transaction.save();

        logger.info(`Payment verified: ${reference} - Status: ${transactionStatus}`);

        res.status(200).json({
            message: 'Payment verified',
            data: {
                reference: transaction.reference,
                amount: transaction.amount,
                status: transaction.status,
                paidAt: transaction.paidAt,
                paymentChannel: transaction.paymentChannel,
                currency: transaction.currency,
            },
        });
    } catch (error) {
        logger.error('Error verifying payment:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default verifyPayment;

