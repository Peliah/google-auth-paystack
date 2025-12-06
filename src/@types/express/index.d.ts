import * as express from 'express';
import { Types } from 'mongoose';
import { Server as SocketIOServer } from "socket.io";

declare global {
    namespace Express {
        interface Request {
            userId?: Types.ObjectId;
        }
    }
}

declare module "express-serve-static-core" {
    interface Request {
        io?: SocketIOServer;
    }
}