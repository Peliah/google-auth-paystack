import type { Request, Response } from 'express';
import { getOrCreateWallet } from '@/services/wallet';
import { logger } from '@/lib/winston';

const getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const wallet = await getOrCreateWallet(userId);

        res.status(200).json({
            balance: wallet.balance,
        });
    } catch (error) {
        logger.error('Error getting wallet balance:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default getBalance;

