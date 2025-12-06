import { Schema, model } from 'mongoose';

export interface IIdempotencyKey {
    key: string;
    userId: string;
    response: Record<string, unknown>;
    statusCode: number;
    expiresAt: Date;
}

const idempotencySchema = new Schema<IIdempotencyKey>({
    key: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
    },
    response: {
        type: Schema.Types.Mixed,
        required: true,
    },
    statusCode: {
        type: Number,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index - auto delete when expired
    },
}, {
    timestamps: true,
});

// Compound index for fast lookups
idempotencySchema.index({ key: 1, userId: 1 }, { unique: true });

export default model<IIdempotencyKey>('IdempotencyKey', idempotencySchema);

