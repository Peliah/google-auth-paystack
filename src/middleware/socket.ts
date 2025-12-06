import type { NextFunction, Request, Response } from 'express';
import { io } from '@/server';

const attachSocket = (req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
};

export default attachSocket;