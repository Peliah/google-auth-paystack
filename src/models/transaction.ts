import { Schema, model, Types } from 'mongoose';

export interface ITransaction {
    userId: Types.ObjectId;
    reference: string;
    amount: number;
    email: string;
    status: 'pending' | 'success' | 'failed' | 'abandoned';
    currency: string;
    paymentChannel?: string;
    paidAt?: Date;
    metadata?: Record<string, unknown>;
}

const transactionSchema = new Schema<ITransaction>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        index: true,
    },
    reference: {
        type: String,
        required: [true, 'Transaction reference is required'],
        unique: true,
        index: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'success', 'failed', 'abandoned'],
            message: '{VALUE} is not a valid status',
        },
        default: 'pending',
        index: true,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    paymentChannel: {
        type: String,
    },
    paidAt: {
        type: Date,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

export default model<ITransaction>('Transaction', transactionSchema);

