import type { Request, Response } from 'express';
import ApiKey from '@/models/apiKey';
import { logger } from '@/lib/winston';

interface RevokeKeyBody {
    key_id: string;
}

const revokeKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { key_id } = req.body as RevokeKeyBody;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const apiKey = await ApiKey.findOne({
            _id: key_id,
            userId,
        });

        if (!apiKey) {
            res.status(404).json({
                code: 'KeyNotFound',
                message: 'API key not found',
            });
            return;
        }

        if (apiKey.revoked) {
            res.status(400).json({
                code: 'KeyAlreadyRevoked',
                message: 'API key is already revoked',
            });
            return;
        }

        apiKey.revoked = true;
        await apiKey.save();

        logger.info(`API key revoked for user ${userId}: ${apiKey.keyPrefix}`);

        res.status(200).json({
            status: 'success',
            message: 'API key revoked successfully',
        });
    } catch (error) {
        logger.error('Error revoking API key:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default revokeKey;


