import { Types } from 'mongoose';
import Wallet, { generateWalletNumber } from '@/models/wallet';
import { logger } from '@/lib/winston';

/**
 * Get or create a wallet for a user
 * Uses lazy creation - wallet is created on first access
 */
export async function getOrCreateWallet(userId: Types.ObjectId) {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
        let walletNumber = generateWalletNumber();
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            const exists = await Wallet.exists({ walletNumber });
            if (!exists) break;
            walletNumber = generateWalletNumber();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique wallet number');
        }

        wallet = await Wallet.create({
            userId,
            walletNumber,
            balance: 0,
        });

        logger.info(`Wallet created for user ${userId}: ${walletNumber}`);
    }

    return wallet;
}

/**
 * Get wallet by user ID (does not create if not exists)
 */
export async function getWalletByUserId(userId: Types.ObjectId) {
    return Wallet.findOne({ userId });
}

/**
 * Get wallet by wallet number
 */
export async function getWalletByNumber(walletNumber: string) {
    return Wallet.findOne({ walletNumber });
}

/**
 * Credit a wallet (add funds)
 * Returns the updated wallet
 */
export async function creditWallet(walletId: Types.ObjectId, amount: number) {
    if (amount <= 0) {
        throw new Error('Credit amount must be positive');
    }

    const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        { $inc: { balance: amount } },
        { new: true }
    );

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    logger.info(`Wallet ${wallet.walletNumber} credited with ${amount}. New balance: ${wallet.balance}`);
    return wallet;
}

/**
 * Debit a wallet (remove funds)
 * Returns the updated wallet or throws if insufficient balance
 */
export async function debitWallet(walletId: Types.ObjectId, amount: number) {
    if (amount <= 0) {
        throw new Error('Debit amount must be positive');
    }

    const wallet = await Wallet.findById(walletId);

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
    }

    wallet.balance -= amount;
    await wallet.save();

    logger.info(`Wallet ${wallet.walletNumber} debited ${amount}. New balance: ${wallet.balance}`);
    return wallet;
}

