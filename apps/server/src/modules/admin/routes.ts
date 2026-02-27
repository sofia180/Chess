import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config';
import { prisma } from '../../db';

function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== env.ADMIN_API_KEY) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  return next();
}

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get('/stats', async (_req, res) => {
  const [users, games, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.gameRoom.count(),
    prisma.transaction.aggregate({ where: { type: 'FEE', status: 'COMPLETED' }, _sum: { amount: true } })
  ]);
  return res.json({
    ok: true,
    users,
    games,
    revenueTotal: revenue._sum.amount?.toString() ?? '0'
  });
});

adminRouter.get('/users', async (req, res) => {
  const Q = z.object({ q: z.string().optional(), take: z.coerce.number().int().min(1).max(100).default(50) });
  const { q, take } = Q.parse(req.query);
  const where = q
    ? {
        OR: [{ username: { contains: q, mode: 'insensitive' as const } }, { telegramId: { contains: q } }, { referralCode: { contains: q.toUpperCase() } }]
      }
    : {};
  const users = await prisma.user.findMany({
    where,
    take,
    orderBy: { createdAt: 'desc' },
    select: { id: true, telegramId: true, username: true, referralCode: true, referredById: true, isBanned: true, createdAt: true }
  });
  return res.json({ ok: true, users });
});

adminRouter.post('/ban', async (req, res) => {
  const Body = z.object({ userId: z.string().min(1), banned: z.boolean() });
  const { userId, banned } = Body.parse(req.body);
  const user = await prisma.user.update({ where: { id: userId }, data: { isBanned: banned } });
  return res.json({ ok: true, user: { id: user.id, isBanned: user.isBanned } });
});

adminRouter.get('/games', async (req, res) => {
  const Q = z.object({ take: z.coerce.number().int().min(1).max(100).default(50) });
  const { take } = Q.parse(req.query);
  const games = await prisma.gameRoom.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    select: { id: true, gameType: true, stakeAsset: true, stakeAmount: true, status: true, player1Id: true, player2Id: true, winnerId: true, createdAt: true }
  });
  return res.json({ ok: true, games: games.map((g) => ({ ...g, stakeAmount: g.stakeAmount.toString() })) });
});

