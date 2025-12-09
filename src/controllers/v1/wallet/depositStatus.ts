import type { Request, Response } from 'express';
import Transaction from '@/models/transaction';
import { logger } from '@/lib/winston';

/**
 * Get deposit status by reference
 * This is a READ-ONLY endpoint - it does NOT credit the wallet
 * Only the webhook is allowed to credit wallets
 */
const getDepositStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reference } = req.params;

        if (!reference) {
            res.status(400).json({
                code: 'MissingReference',
                message: 'Transaction reference is required',
            });
            return;
        }

        const transaction = await Transaction.findOne({
            reference,
            type: 'deposit',
        });

        if (!transaction) {
            res.status(404).json({
                code: 'TransactionNotFound',
                message: 'Deposit transaction not found',
            });
            return;
        }

        res.status(200).json({
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
        });
    } catch (error) {
        logger.error('Error getting deposit status:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default getDepositStatus;

