import type { Request, Response } from 'express';
import ApiKey, {
    generateApiKey,
    calculateExpiryDate,
    isValidExpiry,
    type ApiKeyPermission,
} from '@/models/apiKey';
import { logger } from '@/lib/winston';

const MAX_ACTIVE_KEYS = 5;
const VALID_PERMISSIONS: ApiKeyPermission[] = ['deposit', 'transfer', 'read'];

interface CreateKeyBody {
    name: string;
    permissions: string[];
    expiry: string;
}

const createKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, permissions, expiry } = req.body as CreateKeyBody;
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

        const invalidPermissions = permissions.filter(
            (p) => !VALID_PERMISSIONS.includes(p as ApiKeyPermission)
        );

        if (invalidPermissions.length > 0) {
            res.status(400).json({
                code: 'InvalidPermissions',
                message: `Invalid permissions: ${invalidPermissions.join(', ')}. Valid: deposit, transfer, read`,
            });
            return;
        }

        if (permissions.length === 0) {
            res.status(400).json({
                code: 'InvalidPermissions',
                message: 'At least one permission is required',
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
            name,
            keyHash,
            keyPrefix,
            permissions: permissions as ApiKeyPermission[],
            expiresAt,
            revoked: false,
        });

        logger.info(`API key created for user ${userId}: ${keyPrefix}`);

        res.status(201).json({
            api_key: rawKey,
            expires_at: expiresAt.toISOString(),
        });
    } catch (error) {
        logger.error('Error creating API key:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default createKey;

