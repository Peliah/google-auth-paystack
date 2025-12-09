import { Schema, model, Types } from 'mongoose';
import crypto from 'crypto';

export type ApiKeyPermission = 'deposit' | 'transfer' | 'read';

export interface IApiKey {
    userId: Types.ObjectId;
    name: string;
    keyHash: string;
    keyPrefix: string;
    permissions: ApiKeyPermission[];
    expiresAt: Date;
    revoked: boolean;
}

const apiKeySchema = new Schema<IApiKey>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        index: true,
    },
    name: {
        type: String,
        required: [true, 'API key name is required'],
        maxlength: [50, 'Name must be less than 50 characters'],
    },
    keyHash: {
        type: String,
        required: [true, 'Key hash is required'],
        unique: true,
    },
    keyPrefix: {
        type: String,
        required: [true, 'Key prefix is required'],
    },
    permissions: {
        type: [String],
        required: [true, 'Permissions are required'],
        enum: {
            values: ['deposit', 'transfer', 'read'],
            message: '{VALUE} is not a valid permission',
        },
        validate: {
            validator: (v: string[]) => v.length > 0,
            message: 'At least one permission is required',
        },
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiry date is required'],
        index: true,
    },
    revoked: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});


apiKeySchema.index({ userId: 1, revoked: 1 });

/**
 * Generate a new API key with prefix
 * Returns { rawKey, keyHash, keyPrefix }
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12) + '...';

    return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Calculate expiry date from expiry string
 * @param expiry - '1H' | '1D' | '1M' | '1Y'
 */
export function calculateExpiryDate(expiry: string): Date {
    const now = new Date();

    switch (expiry) {
        case '1H':
            return new Date(now.getTime() + 60 * 60 * 1000);
        case '1D':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case '1M':
            return new Date(now.setMonth(now.getMonth() + 1));
        case '1Y':
            return new Date(now.setFullYear(now.getFullYear() + 1));
        default:
            throw new Error('Invalid expiry format. Use 1H, 1D, 1M, or 1Y');
    }
}

/**
 * Check if expiry string is valid
 */
export function isValidExpiry(expiry: string): expiry is '1H' | '1D' | '1M' | '1Y' {
    return ['1H', '1D', '1M', '1Y'].includes(expiry);
}

export default model<IApiKey>('ApiKey', apiKeySchema);

