import { Schema, model, Types } from 'mongoose';

export type TransactionType = 'deposit' | 'transfer';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'abandoned';

export interface ITransaction {
    userId: Types.ObjectId;
    type: TransactionType;
    reference: string;
    amount: number;
    email: string;
    status: TransactionStatus;
    currency: string;
    paymentChannel?: string;
    paidAt?: Date;
    metadata?: Record<string, unknown>;

    senderWalletId?: Types.ObjectId;
    recipientWalletId?: Types.ObjectId;
}

const transactionSchema = new Schema<ITransaction>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        index: true,
    },
    type: {
        type: String,
        enum: {
            values: ['deposit', 'transfer'],
            message: '{VALUE} is not a valid transaction type',
        },
        required: [true, 'Transaction type is required'],
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

    senderWalletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        index: true,
    },
    recipientWalletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        index: true,
    },
}, {
    timestamps: true,
});


transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1 });

export default model<ITransaction>('Transaction', transactionSchema);
