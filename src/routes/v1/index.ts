import { Router } from "express";
import authRoutes from './auth';
import userRoutes from './user';

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

export default router;