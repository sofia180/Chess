import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { env } from '../../config';
import { signJwt } from './jwt';
import { extractTelegramUser, parseInitData, verifyTelegramInitData } from './telegram';
import { requireAuth, type AuthedRequest } from './middleware';

function randomReferralCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function ensureWallet(userId: string) {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: {
      userId,
      assets: {
        create: [{ asset: 'USDT' }, { asset: 'ETH' }, { asset: 'POLYGON' }]
      }
    },
    update: {},
    include: { assets: true }
  });

  // In case assets were added later
  const have = new Set(wallet.assets.map((a) => a.asset));
  const need = (['USDT', 'ETH', 'POLYGON'] as const).filter((a) => !have.has(a));
  if (need.length) {
    await prisma.walletAsset.createMany({
      data: need.map((asset) => ({ walletId: wallet.id, asset })),
      skipDuplicates: true
    });
  }
}

export const authRouter = Router();

authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, referralCode: true, referredById: true, isBanned: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
  if (user.isBanned) return res.status(403).json({ ok: false, error: 'User banned' });
  return res.json({ ok: true, user });
});

authRouter.post('/telegram', async (req, res) => {
  try {
    const Body = z.object({ initData: z.string().min(1) });
    const { initData } = Body.parse(req.body);

    const params = parseInitData(initData);
    const ok = verifyTelegramInitData(params, env.TELEGRAM_BOT_TOKEN);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid Telegram init data' });

    const tgUser = extractTelegramUser(params);
    if (!tgUser) return res.status(400).json({ ok: false, error: 'Missing Telegram user' });

    const telegramId = String(tgUser.id);
    const username = tgUser.username ?? null;
    const startParam = params.start_param?.trim();

    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { telegramId } });
      if (existing) {
        if (existing.isBanned) throw new Error('User banned');
        if (username && existing.username !== username) {
          return tx.user.update({ where: { id: existing.id }, data: { username } });
        }
        return existing;
      }

      // referral attach if exists
      let referredById: string | null = null;
      if (startParam) {
        const refCode = startParam.startsWith('ref_') ? startParam.slice(4) : startParam;
        const referrer = await tx.user.findUnique({ where: { referralCode: refCode.toUpperCase() } });
        if (referrer) referredById = referrer.id;
      }

      // retry referral codes until unique
      for (let i = 0; i < 5; i++) {
        const referralCode = randomReferralCode();
        try {
          return await tx.user.create({
            data: {
              telegramId,
              username,
              referralCode,
              referredById
            }
          });
        } catch {
          // ignore unique collision
        }
      }
      throw new Error('Failed to create user');
    });

    await ensureWallet(user.id);
    const token = signJwt({ userId: user.id });
    return res.json({ ok: true, token, user: { id: user.id, username: user.username, referralCode: user.referralCode } });
  } catch (e: any) {
    const msg = e?.message ?? 'Failed';
    const status = msg === 'User banned' ? 403 : 400;
    return res.status(status).json({ ok: false, error: msg });
  }
});

// MVP-only: dev login for web version
authRouter.post('/dev', async (req, res) => {
  try {
    const Body = z.object({
      username: z.string().min(3).max(24),
      referralCode: z.string().optional()
    });
    const { username, referralCode } = Body.parse(req.body);

    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { telegramId: null, username } });
      if (existing) {
        if (existing.isBanned) throw new Error('User banned');
        return existing;
      }

      let referredById: string | null = null;
      if (referralCode) {
        const referrer = await tx.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
        if (referrer) referredById = referrer.id;
      }

      for (let i = 0; i < 5; i++) {
        const code = randomReferralCode();
        try {
          return await tx.user.create({
            data: { telegramId: null, username, referralCode: code, referredById }
          });
        } catch {
          // ignore unique collision
        }
      }
      throw new Error('Failed to create user');
    });

    await ensureWallet(user.id);
    const token = signJwt({ userId: user.id });
    return res.json({ ok: true, token, user: { id: user.id, username: user.username, referralCode: user.referralCode } });
  } catch (e: any) {
    const msg = e?.message ?? 'Failed';
    const status = msg === 'User banned' ? 403 : 400;
    return res.status(status).json({ ok: false, error: msg });
  }
});

