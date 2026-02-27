import { Router } from 'express';
import { prisma } from '../../db';

export const leaderboardRouter = Router();

leaderboardRouter.get('/top', async (_req, res) => {
  const winners = await prisma.gameRoom.groupBy({
    by: ['winnerId'],
    where: { status: 'ENDED', winnerId: { not: null } },
    _count: { winnerId: true },
    orderBy: { _count: { winnerId: 'desc' } },
    take: 20
  });

  const userIds = winners.map((w) => w.winnerId!).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true }
  });
  const uMap = new Map(users.map((u) => [u.id, u]));

  const rows = winners.map((w) => ({
    userId: w.winnerId!,
    username: uMap.get(w.winnerId!)?.username ?? null,
    wins: w._count.winnerId
  }));

  return res.json({ ok: true, rows });
});

