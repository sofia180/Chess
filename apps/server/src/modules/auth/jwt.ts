import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config';
import type { JwtUser } from '../../types';

export function signJwt(payload: JwtUser): string {
  const secret: Secret = env.JWT_SECRET as unknown as Secret;
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as unknown as any };
  return jwt.sign(payload, secret, options);
}

export function verifyJwt(token: string): JwtUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== 'object' || decoded == null) throw new Error('Invalid token');
  const u = decoded as Partial<JwtUser>;
  if (!u.userId || typeof u.userId !== 'string') throw new Error('Invalid token');
  return { userId: u.userId };
}

