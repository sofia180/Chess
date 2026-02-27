import type { NextFunction, Request, Response } from 'express';
import { verifyJwt } from './jwt';

export type AuthedRequest = Request & { userId: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Missing token' });
  const token = auth.slice('Bearer '.length);
  try {
    const { userId } = verifyJwt(token);
    (req as AuthedRequest).userId = userId;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

