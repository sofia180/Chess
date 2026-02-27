import { Prisma } from '@prisma/client';
import type { Asset } from '@prisma/client';
import { prisma } from '../../db';
import type { GameType } from '../../types';

function inviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function createRoom(params: {
  userId: string;
  gameType: GameType;
  stakeAsset: Asset;
  stakeAmountStr: string;
  isPrivate: boolean;
}) {
  const stakeAmount = new Prisma.Decimal(params.stakeAmountStr);
  if (stakeAmount.lte(0)) throw new Error('Invalid stake');

  const invite = params.isPrivate ? inviteCode() : null;
  const room = await prisma.gameRoom.create({
    data: {
      gameType: params.gameType,
      stakeAsset: params.stakeAsset,
      stakeAmount,
      status: 'WAITING',
      isPrivate: params.isPrivate,
      inviteCode: invite,
      player1Id: params.userId
    }
  });
  return { roomId: room.id, inviteCode: room.inviteCode ?? undefined };
}

export async function joinRoom(params: { userId: string; roomId: string }) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.gameRoom.findUnique({ where: { id: params.roomId } });
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Room not joinable');
    if (room.player1Id === params.userId) return room;
    if (room.player2Id) throw new Error('Room is full');
    return tx.gameRoom.update({
      where: { id: room.id },
      data: { player2Id: params.userId, status: 'ACTIVE' }
    });
  });
}

export async function joinRoomByInvite(params: { userId: string; inviteCode: string }) {
  const code = params.inviteCode.trim().toUpperCase();
  if (!code) throw new Error('Missing invite code');
  const room = await prisma.gameRoom.findUnique({ where: { inviteCode: code } });
  if (!room) throw new Error('Invite not found');
  return joinRoom({ userId: params.userId, roomId: room.id });
}

