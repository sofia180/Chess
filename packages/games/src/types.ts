export type GameType = 'chess' | 'tictactoe';

export type GameStatus = 'waiting' | 'active' | 'ended';

export type GameEndReason =
  | 'checkmate'
  | 'resign'
  | 'timeout'
  | 'draw'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_move_rule'
  | 'ttt_win'
  | 'ttt_draw'
  | 'forfeit';

export type PlayerSide = 'p1' | 'p2';

export type GameMove = {
  playerId: string;
  move: unknown;
  createdAt: number;
};

export type StartState = {
  status: GameStatus;
  nextTurn: PlayerSide;
  snapshot: unknown;
};

export type ApplyMoveResult =
  | { ok: true; state: StartState; end?: { winnerSide?: PlayerSide; reason: GameEndReason } }
  | { ok: false; error: string };

export interface ServerGameEngine {
  readonly gameType: GameType;
  create(): StartState;
  applyMove(input: {
    state: StartState;
    side: PlayerSide;
    move: unknown;
  }): ApplyMoveResult;
}

