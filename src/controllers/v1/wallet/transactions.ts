import type { Request, Response } from 'express';
import Transaction from '@/models/transaction';
import { logger } from '@/lib/winston';

const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const transactions = await Transaction.find({ userId })
            .select('type amount status createdAt reference')
            .sort({ createdAt: -1 })
            .lean();

        const formattedTransactions = transactions.map((tx) => ({
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
        }));

        res.status(200).json(formattedTransactions);
    } catch (error) {
        logger.error('Error getting transactions:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default getTransactions;

