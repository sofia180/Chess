import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config';
import { authRouter } from './modules/auth/routes';
import { walletRouter } from './modules/wallet/routes';
import { leaderboardRouter } from './modules/leaderboard/routes';
import { adminRouter } from './modules/admin/routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/wallet', walletRouter);
  app.use('/leaderboard', leaderboardRouter);
  app.use('/admin', adminRouter);

  return app;
}

