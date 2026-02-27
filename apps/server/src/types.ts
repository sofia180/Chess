import type { Asset } from '@prisma/client';

export type JwtUser = { userId: string };

export type GameType = 'chess' | 'tictactoe';

export type RoomStatus = 'waiting' | 'active' | 'ended' | 'cancelled';

export type CreateRoomPayload = {
  gameType: GameType;
  stakeAsset: Asset;
  stakeAmount: string; // decimal string
  isPrivate?: boolean;
};

export type JoinRoomPayload = {
  roomId?: string;
  inviteCode?: string;
};

export type JoinRandomPayload = {
  gameType: GameType;
  stakeAsset: Asset;
  stakeAmount: string; // decimal string
};

export type ClientToServerEvents = {
  create_room: (payload: CreateRoomPayload, cb: (resp: { ok: true; roomId: string; inviteCode?: string } | { ok: false; error: string }) => void) => void;
  join_room: (payload: JoinRoomPayload, cb: (resp: { ok: true; roomId: string } | { ok: false; error: string }) => void) => void;
  join_random: (payload: JoinRandomPayload, cb: (resp: { ok: true; roomId: string } | { ok: false; error: string }) => void) => void;
  move: (payload: { roomId: string; move: unknown }, cb: (resp: { ok: true } | { ok: false; error: string }) => void) => void;
  resign: (payload: { roomId: string }, cb: (resp: { ok: true } | { ok: false; error: string }) => void) => void;
};

export type ServerToClientEvents = {
  room_created: (payload: { roomId: string; inviteCode?: string }) => void;
  match_found: (payload: { roomId: string }) => void;
  start_game: (payload: {
    roomId: string;
    gameType: GameType;
    stakeAsset: Asset;
    stakeAmount: string;
    youAre: 'p1' | 'p2';
    opponent: { userId: string; username?: string | null };
    state: unknown;
  }) => void;
  move: (payload: { roomId: string; by: 'p1' | 'p2'; move: unknown; state: unknown }) => void;
  game_end: (payload: {
    roomId: string;
    winnerUserId?: string;
    reason: string;
    payout?: { asset: Asset; amount: string; feeAmount: string; referralRewardAmount?: string };
  }) => void;
  error: (payload: { message: string }) => void;
};

