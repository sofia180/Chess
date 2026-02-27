import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config';
import { verifyJwt } from './modules/auth/jwt';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import { MatchmakingQueue, queueKey } from './modules/matchmaking/queue';
import * as mm from './modules/matchmaking/service';
import * as games from './modules/games/service';
import { prisma } from './db';

type SocketData = { userId: string };

const queue = new MatchmakingQueue();

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
      origin: env.WEB_ORIGIN,
      credentials: true
    }
  });

  io.use((socket, next) => {
    (async () => {
      try {
      const token =
        (socket.handshake.auth as any)?.token ||
        (typeof socket.handshake.headers.authorization === 'string' &&
          socket.handshake.headers.authorization.startsWith('Bearer ') &&
          socket.handshake.headers.authorization.slice('Bearer '.length));
      if (!token) return next(new Error('Missing token'));
      const { userId } = verifyJwt(token);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true } });
      if (!user) return next(new Error('User not found'));
      if (user.isBanned) return next(new Error('User banned'));
      socket.data.userId = userId;
      return next();
      } catch {
        return next(new Error('Invalid token'));
      }
    })().catch(() => next(new Error('Auth error')));
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    socket.on('create_room', async (payload, cb) => {
      try {
        const { roomId, inviteCode } = await mm.createRoom({
          userId,
          gameType: payload.gameType,
          stakeAsset: payload.stakeAsset,
          stakeAmountStr: payload.stakeAmount,
          isPrivate: !!payload.isPrivate
        });
        socket.join(roomId);
        socket.emit('room_created', { roomId, inviteCode });
        cb({ ok: true, roomId, inviteCode });
      } catch (e: any) {
        cb({ ok: false, error: e?.message ?? 'Failed' });
      }
    });

    socket.on('join_room', async ({ roomId, inviteCode }, cb) => {
      try {
        const room = inviteCode
          ? await mm.joinRoomByInvite({ userId, inviteCode })
          : await mm.joinRoom({ userId, roomId: roomId ?? '' });
        socket.join(room.id);

        io.to(room.id).emit('match_found', { roomId: room.id });
        const started = await games.startGame(room.id);

        const p1 = await prisma.user.findUnique({ where: { id: started.player1Id }, select: { id: true, username: true } });
        const p2 = started.player2Id
          ? await prisma.user.findUnique({ where: { id: started.player2Id }, select: { id: true, username: true } })
          : null;
        if (!p1 || !p2) throw new Error('Players missing');

        const youAre = started.player1Id === userId ? 'p1' : 'p2';
        const opponent = youAre === 'p1' ? p2 : p1;

        io.to(started.id).emit('start_game', {
          roomId: started.id,
          gameType: started.gameType as any,
          stakeAsset: started.stakeAsset,
          stakeAmount: started.stakeAmount.toString(),
          youAre,
          opponent: { userId: opponent.id, username: opponent.username },
          state: started.gameState
        });

        cb({ ok: true, roomId: started.id });
      } catch (e: any) {
        cb({ ok: false, error: e?.message ?? 'Failed' });
      }
    });

    socket.on('join_random', async (payload, cb) => {
      try {
        const key = queueKey({ gameType: payload.gameType, stakeAsset: payload.stakeAsset, stakeAmount: payload.stakeAmount });
        const other = queue.dequeueOther(key, userId);
        if (!other) {
          const { roomId } = await mm.createRoom({
            userId,
            gameType: payload.gameType,
            stakeAsset: payload.stakeAsset,
            stakeAmountStr: payload.stakeAmount,
            isPrivate: false
          });
          queue.enqueue(key, { userId, roomId, createdAt: Date.now() });
          socket.join(roomId);
          cb({ ok: true, roomId });
          return;
        }

        const room = await mm.joinRoom({ userId, roomId: other.roomId });
        socket.join(room.id);

        io.to(room.id).emit('match_found', { roomId: room.id });
        const started = await games.startGame(room.id);

        const p1 = await prisma.user.findUnique({ where: { id: started.player1Id }, select: { id: true, username: true } });
        const p2 = started.player2Id
          ? await prisma.user.findUnique({ where: { id: started.player2Id }, select: { id: true, username: true } })
          : null;
        if (!p1 || !p2) throw new Error('Players missing');

        const youAre = started.player1Id === userId ? 'p1' : 'p2';
        const opponent = youAre === 'p1' ? p2 : p1;

        io.to(started.id).emit('start_game', {
          roomId: started.id,
          gameType: started.gameType as any,
          stakeAsset: started.stakeAsset,
          stakeAmount: started.stakeAmount.toString(),
          youAre,
          opponent: { userId: opponent.id, username: opponent.username },
          state: started.gameState
        });

        cb({ ok: true, roomId: started.id });
      } catch (e: any) {
        cb({ ok: false, error: e?.message ?? 'Failed' });
      }
    });

    socket.on('move', async ({ roomId, move }, cb) => {
      try {
        const result = await games.applyMove({ roomId, userId, move });
        const room = result.room;
        const by = room.player1Id === userId ? 'p1' : 'p2';
        io.to(roomId).emit('move', { roomId, by, move, state: result.state });

        if ('end' in result && result.end && result.settlement) {
          io.to(roomId).emit('game_end', {
            roomId,
            winnerUserId: result.end.winnerId ?? undefined,
            reason: result.end.reason,
            payout: result.end.winnerId
              ? {
                  asset: room.stakeAsset,
                  amount: result.settlement.payoutAmount,
                  feeAmount: result.settlement.feeAmount,
                  referralRewardAmount: result.settlement.referralRewardAmount
                }
              : undefined
          });
        }

        cb({ ok: true });
      } catch (e: any) {
        cb({ ok: false, error: e?.message ?? 'Failed' });
      }
    });

    socket.on('resign', async ({ roomId }, cb) => {
      try {
        const result = await games.resign({ roomId, userId });
        if (!result.settlement) {
          cb({ ok: true });
          return;
        }
        io.to(roomId).emit('game_end', {
          roomId,
          winnerUserId: result.end.winnerId,
          reason: result.end.reason,
          payout: {
            asset: result.room.stakeAsset,
            amount: result.settlement.payoutAmount,
            feeAmount: result.settlement.feeAmount,
            referralRewardAmount: result.settlement.referralRewardAmount
          }
        });
        cb({ ok: true });
      } catch (e: any) {
        cb({ ok: false, error: e?.message ?? 'Failed' });
      }
    });

    socket.on('disconnect', async () => {
      const removed = queue.removeUser(userId);
      for (const e of removed) {
        await games.cancelRoom(e.roomId, 'creator_disconnected');
      }

      // MVP: forfeit any active games this user is in
      const active = await prisma.gameRoom.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ player1Id: userId }, { player2Id: userId }]
        },
        select: { id: true }
      });
      for (const r of active) {
        try {
          const result = await games.resign({ roomId: r.id, userId, reason: 'disconnect' });
          io.to(r.id).emit('game_end', {
            roomId: r.id,
            winnerUserId: result.end.winnerId,
            reason: result.end.reason,
            payout: {
              asset: result.room.stakeAsset,
              amount: result.settlement.payoutAmount,
              feeAmount: result.settlement.feeAmount,
              referralRewardAmount: result.settlement.referralRewardAmount
            }
          });
        } catch {
          // ignore
        }
      }
    });
  });

  return io;
}

