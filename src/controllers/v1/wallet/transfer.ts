import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '@/models/transaction';
import Wallet from '@/models/wallet';
import User from '@/models/user';
import { getOrCreateWallet } from '@/services/wallet';
import { logger } from '@/lib/winston';
import crypto from 'crypto';

interface TransferBody {
    wallet_number: string;
    amount: number;
}

const transfer = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();

    try {
        const { wallet_number, amount } = req.body as TransferBody;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const senderWallet = await getOrCreateWallet(userId);

        if (senderWallet.walletNumber === wallet_number) {
            res.status(400).json({
                code: 'InvalidTransfer',
                message: 'Cannot transfer to your own wallet',
            });
            return;
        }

        if (senderWallet.balance < amount) {
            res.status(400).json({
                code: 'InsufficientBalance',
                message: 'Insufficient balance for this transfer',
            });
            return;
        }

        const recipientWallet = await Wallet.findOne({ walletNumber: wallet_number });

        if (!recipientWallet) {
            res.status(404).json({
                code: 'RecipientNotFound',
                message: 'Recipient wallet not found',
            });
            return;
        }

        const recipientUser = await User.findById(recipientWallet.userId).select('email').lean();

        if (!recipientUser) {
            res.status(404).json({
                code: 'RecipientNotFound',
                message: 'Recipient user not found',
            });
            return;
        }

        const senderUser = await User.findById(userId).select('email').lean();

        if (!senderUser) {
            res.status(404).json({
                code: 'UserNotFound',
                message: 'Sender user not found',
            });
            return;
        }

        const reference = `txf_${crypto.randomBytes(16).toString('hex')}`;

        session.startTransaction();

        try {
            await Wallet.findByIdAndUpdate(
                senderWallet._id,
                { $inc: { balance: -amount } },
                { session }
            );

            await Wallet.findByIdAndUpdate(
                recipientWallet._id,
                { $inc: { balance: amount } },
                { session }
            );

            await Transaction.create([{
                userId,
                type: 'transfer',
                reference,
                amount,
                email: senderUser.email,
                status: 'success',
                senderWalletId: senderWallet._id,
                recipientWalletId: recipientWallet._id,
                metadata: {
                    direction: 'outgoing',
                    recipientWalletNumber: wallet_number,
                },
            }], { session });

            await Transaction.create([{
                userId: recipientWallet.userId,
                type: 'transfer',
                reference: `${reference}_in`,
                amount,
                email: recipientUser.email,
                status: 'success',
                senderWalletId: senderWallet._id,
                recipientWalletId: recipientWallet._id,
                metadata: {
                    direction: 'incoming',
                    senderWalletNumber: senderWallet.walletNumber,
                },
            }], { session });

            await session.commitTransaction();

            logger.info(`Transfer completed: ${reference} - ${amount} from ${senderWallet.walletNumber} to ${wallet_number}`);

            res.status(200).json({
                status: 'success',
                message: 'Transfer completed',
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    } catch (error) {
        logger.error('Error processing transfer:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    } finally {
        session.endSession();
    }
};

export default transfer;

