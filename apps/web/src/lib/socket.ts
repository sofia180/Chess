import { io, type Socket } from 'socket.io-client';
import { env } from './env';

type GameType = 'chess' | 'tictactoe';
type Asset = 'USDT' | 'ETH' | 'POLYGON';

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
    state: any;
  }) => void;
  move: (payload: { roomId: string; by: 'p1' | 'p2'; move: any; state: any }) => void;
  game_end: (payload: {
    roomId: string;
    winnerUserId?: string;
    reason: string;
    payout?: { asset: Asset; amount: string; feeAmount: string; referralRewardAmount?: string };
  }) => void;
  error: (payload: { message: string }) => void;
};

export type ClientToServerEvents = {
  create_room: (
    payload: { gameType: GameType; stakeAsset: Asset; stakeAmount: string; isPrivate?: boolean },
    cb: (resp: { ok: true; roomId: string; inviteCode?: string } | { ok: false; error: string }) => void
  ) => void;
  join_room: (
    payload: { roomId?: string; inviteCode?: string },
    cb: (resp: { ok: true; roomId: string } | { ok: false; error: string }) => void
  ) => void;
  join_random: (
    payload: { gameType: GameType; stakeAsset: Asset; stakeAmount: string },
    cb: (resp: { ok: true; roomId: string } | { ok: false; error: string }) => void
  ) => void;
  move: (payload: { roomId: string; move: any }, cb: (resp: { ok: true } | { ok: false; error: string }) => void) => void;
  resign: (payload: { roomId: string }, cb: (resp: { ok: true } | { ok: false; error: string }) => void) => void;
};

export function createAuthedSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(env.socketUrl, {
    transports: ['websocket'],
    auth: { token }
  });
}

