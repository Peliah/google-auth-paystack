import { Router } from "express";
import authRoutes from './auth';
import userRoutes from './user';
import paymentRoutes from './payments';
import walletRoutes from './wallet';
import keysRoutes from './keys';

const router = Router();

router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the auth-paystack project!',
        status: 'OK',
        version: '1.0.0',
        docs: "",
        timestamp: new Date().toISOString(),

    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/keys', keysRoutes);

export default router;