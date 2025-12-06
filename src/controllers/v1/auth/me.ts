import type { Request, Response } from 'express';
import User from '@/models/user';
import { logger } from '@/lib/winston';

const me = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const user = await User.findById(userId)
            .select('-password')
            .lean()
            .exec();

        if (!user) {
            res.status(404).json({
                code: 'UserNotFound',
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        logger.error('Error fetching current user:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default me;

