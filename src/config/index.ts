import dotenv from 'dotenv';
import type ms from 'ms';
dotenv.config();

const config = {
    PORT: process.env.PORT || 3040,
    NODE_ENV: process.env.NODE_ENV,
    WHITELIST_ORIGINS: [
        'http://localhost:3040', 'https://r21l7s6q-3040.uks1.devtunnels.ms/'],
    MONGO_URI: process.env.MONGO_URI,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    ACCESS_TOKEN_EXPIRY: (process.env.ACCESS_TOKEN_EXPIRY || '10d') as ms.StringValue,
    REFRESH_TOKEN_EXPIRY: (process.env.REFRESH_TOKEN_EXPIRY || '10d') as ms.StringValue,
    WHITELIST_ADMINS_EMAIL: ['pelepoupa@gmail.com', 'mrbuzzlightyear001@gmail.com'],
    defaultResLimit: 20,
    defaultResOffset: 0,
};

export default config;