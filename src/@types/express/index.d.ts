import * as express from 'express';
import { Types } from 'mongoose';
import { Server as SocketIOServer } from "socket.io";
import type { ApiKeyPermission } from '@/models/apiKey';

export type AuthType = 'jwt' | 'apikey';

declare global {
    namespace Express {
        interface Request {
            userId?: Types.ObjectId;

            authType?: AuthType;
            apiKeyPermissions?: ApiKeyPermission[];
        }
    }
}

declare module "express-serve-static-core" {
    interface Request {
        io?: SocketIOServer;
    }
}
