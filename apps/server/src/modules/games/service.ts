import { Prisma, type Asset, type GameRoom } from '@prisma/client';
import { prisma } from '../../db';
import { GAME_ENGINES } from './registry';
import type { GameType } from '../../types';
import { lockForGame, settleWinnerTakeAll, unlockFromGame, d } from '../wallet/service';

function sideFor(room: GameRoom, userId: string): 'p1' | 'p2' {
  if (room.player1Id === userId) return 'p1';
  if (room.player2Id === userId) return 'p2';
  throw new Error('Not in room');
}

function winnerIdFor(room: GameRoom, winnerSide: 'p1' | 'p2'): string {
  if (winnerSide === 'p1') return room.player1Id;
  if (!room.player2Id) throw new Error('Missing player2');
  return room.player2Id;
}

export async function startGame(roomId: string) {
  const room = await prisma.gameRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');
  if (room.status !== 'ACTIVE') throw new Error('Room not active');
  if (!room.player2Id) throw new Error('Missing opponent');
  if (room.gameState) return room; // already started

  const engine = GAME_ENGINES[room.gameType as GameType];
  if (!engine) throw new Error('Unsupported game');

  const state = engine.create();

  const updated = await prisma.gameRoom.update({
    where: { id: room.id },
    data: { gameState: state as unknown as Prisma.InputJsonValue }
  });

  // Lock both players stake
  await lockForGame(room.player1Id, room.stakeAsset, room.stakeAmount.toString(), room.id);
  await lockForGame(room.player2Id, room.stakeAsset, room.stakeAmount.toString(), room.id);

  return updated;
}

export async function applyMove(params: { roomId: string; userId: string; move: unknown }) {
  const room = await prisma.gameRoom.findUnique({ where: { id: params.roomId } });
  if (!room) throw new Error('Room not found');
  if (room.status !== 'ACTIVE') throw new Error('Room not active');
  if (!room.player2Id) throw new Error('Missing opponent');
  if (!room.gameState) throw new Error('Game not started');

  const engine = GAME_ENGINES[room.gameType as GameType];
  if (!engine) throw new Error('Unsupported game');

  const side = sideFor(room, params.userId);
  const state = room.gameState as any;

  const result = engine.applyMove({ state, side, move: params.move });
  if (!result.ok) throw new Error(result.error);

  await prisma.gameMove.create({
    data: {
      gameId: room.id,
      playerId: params.userId,
      move: params.move as any
    }
  });

  if (result.end) {
    const winnerId = result.end.winnerSide ? winnerIdFor(room, result.end.winnerSide) : null;
    const updated = await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        status: 'ENDED',
        winnerId,
        gameState: result.state as unknown as Prisma.InputJsonValue
      }
    });

    const settlement = await settleWinnerTakeAll({
      gameId: room.id,
      asset: room.stakeAsset as Asset,
      stakeAmountStr: room.stakeAmount.toString(),
      player1Id: room.player1Id,
      player2Id: room.player2Id,
      winnerId
    });

    return { room: updated, state: result.state, end: { ...result.end, winnerId }, settlement };
  }

  const updated = await prisma.gameRoom.update({
    where: { id: room.id },
    data: { gameState: result.state as unknown as Prisma.InputJsonValue }
  });
  return { room: updated, state: result.state };
}

export async function resign(params: { roomId: string; userId: string; reason?: string }) {
  const room = await prisma.gameRoom.findUnique({ where: { id: params.roomId } });
  if (!room) throw new Error('Room not found');
  if (room.status !== 'ACTIVE') throw new Error('Room not active');
  if (!room.player2Id) throw new Error('Missing opponent');

  const side = sideFor(room, params.userId);
  const winnerSide: 'p1' | 'p2' = side === 'p1' ? 'p2' : 'p1';
  const winnerId = winnerIdFor(room, winnerSide);

  const updated = await prisma.gameRoom.update({
    where: { id: room.id },
    data: { status: 'ENDED', winnerId }
  });

  const settlement = await settleWinnerTakeAll({
    gameId: room.id,
    asset: room.stakeAsset as Asset,
    stakeAmountStr: room.stakeAmount.toString(),
    player1Id: room.player1Id,
    player2Id: room.player2Id,
    winnerId
  });

  return { room: updated, end: { winnerId, reason: params.reason ?? 'resign' }, settlement };
}

export async function cancelRoom(roomId: string, reason: string) {
  const room = await prisma.gameRoom.findUnique({ where: { id: roomId } });
  if (!room) return;
  if (room.status === 'ENDED' || room.status === 'CANCELLED') return;

  const updated = await prisma.gameRoom.update({
    where: { id: room.id },
    data: { status: 'CANCELLED' }
  });

  // refund if it was already locked
  if (room.status === 'ACTIVE' && room.player2Id) {
    const stake = d(room.stakeAmount);
    await unlockFromGame(room.player1Id, room.stakeAsset as Asset, stake, room.id);
    await unlockFromGame(room.player2Id, room.stakeAsset as Asset, stake, room.id);
  }

  return { room: updated, reason };
}

