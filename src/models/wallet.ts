import { Schema, model, Types } from 'mongoose';

export interface IWallet {
    userId: Types.ObjectId;
    walletNumber: string;
    balance: number;
}

const walletSchema = new Schema<IWallet>({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        unique: true,
        index: true,
    },
    walletNumber: {
        type: String,
        required: [true, 'Wallet number is required'],
        unique: true,
        index: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative'],
    },
}, {
    timestamps: true,
});

/**
 * Generate a unique 13-digit wallet number
 */
export function generateWalletNumber(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return timestamp + random;
}

export default model<IWallet>('Wallet', walletSchema);

