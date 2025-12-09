import type { Request, Response } from 'express';
import ApiKey, {
    generateApiKey,
    calculateExpiryDate,
    isValidExpiry,
} from '@/models/apiKey';
import { logger } from '@/lib/winston';

const MAX_ACTIVE_KEYS = 5;

interface RolloverKeyBody {
    expired_key_id: string;
    expiry: string;
}

const rolloverKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { expired_key_id, expiry } = req.body as RolloverKeyBody;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        if (!isValidExpiry(expiry)) {
            res.status(400).json({
                code: 'InvalidExpiry',
                message: 'Invalid expiry format. Use 1H, 1D, 1M, or 1Y',
            });
            return;
        }

        const expiredKey = await ApiKey.findOne({
            _id: expired_key_id,
            userId,
        });

        if (!expiredKey) {
            res.status(404).json({
                code: 'KeyNotFound',
                message: 'API key not found',
            });
            return;
        }

        if (expiredKey.expiresAt > new Date() && !expiredKey.revoked) {
            res.status(400).json({
                code: 'KeyNotExpired',
                message: 'Cannot rollover a key that is not expired. The key must be expired to rollover.',
            });
            return;
        }

        const activeKeysCount = await ApiKey.countDocuments({
            userId,
            revoked: false,
            expiresAt: { $gt: new Date() },
        });

        if (activeKeysCount >= MAX_ACTIVE_KEYS) {
            res.status(400).json({
                code: 'MaxKeysReached',
                message: `Maximum of ${MAX_ACTIVE_KEYS} active API keys allowed per user`,
            });
            return;
        }

        const { rawKey, keyHash, keyPrefix } = generateApiKey();
        const expiresAt = calculateExpiryDate(expiry);

        await ApiKey.create({
            userId,
            name: expiredKey.name,
            keyHash,
            keyPrefix,
            permissions: expiredKey.permissions,
            expiresAt,
            revoked: false,
        });

        logger.info(`API key rolled over for user ${userId}: ${expiredKey.keyPrefix} -> ${keyPrefix}`);

        res.status(201).json({
            api_key: rawKey,
            expires_at: expiresAt.toISOString(),
        });
    } catch (error) {
        logger.error('Error rolling over API key:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default rolloverKey;

