import jwt from 'jsonwebtoken';
import { env } from '../../config';
import type { JwtUser } from '../../types';

export function signJwt(payload: JwtUser): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== 'object' || decoded == null) throw new Error('Invalid token');
  const u = decoded as Partial<JwtUser>;
  if (!u.userId || typeof u.userId !== 'string') throw new Error('Invalid token');
  return { userId: u.userId };
}

