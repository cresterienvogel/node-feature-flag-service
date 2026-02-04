import { NextFunction, Request, Response } from 'express';
import * as crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const headerId = req.header('x-request-id');
  const id = headerId && headerId.length > 0 ? headerId : crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
