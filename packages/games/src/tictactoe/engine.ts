import type { ApplyMoveResult, PlayerSide, ServerGameEngine, StartState } from '../types.js';

type Cell = null | 'X' | 'O';
type Board = Cell[];

type TttSnapshot = {
  board: Board; // length 9
};

type TttMoveInput = { index: number };

function markForSide(side: PlayerSide): 'X' | 'O' {
  return side === 'p1' ? 'X' : 'O';
}

function otherSide(side: PlayerSide): PlayerSide {
  return side === 'p1' ? 'p2' : 'p1';
}

const wins: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function winner(board: Board): 'X' | 'O' | null {
  for (const [a, b, c] of wins) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  return null;
}

export const TicTacToeEngine: ServerGameEngine = {
  gameType: 'tictactoe',
  create(): StartState {
    return {
      status: 'active',
      nextTurn: 'p1',
      snapshot: { board: Array.from({ length: 9 }, () => null) } satisfies TttSnapshot
    };
  },
  applyMove({ state, side, move }): ApplyMoveResult {
    if (state.status !== 'active') return { ok: false, error: 'Game is not active' };
    if (state.nextTurn !== side) return { ok: false, error: 'Not your turn' };
    const snap = state.snapshot as TttSnapshot;

    if (typeof move !== 'object' || move == null) return { ok: false, error: 'Invalid move' };
    const mv = move as TttMoveInput;
    if (typeof mv.index !== 'number' || !Number.isInteger(mv.index)) return { ok: false, error: 'Invalid move' };
    if (mv.index < 0 || mv.index > 8) return { ok: false, error: 'Invalid cell' };

    const board = snap.board.slice();
    if (board[mv.index] != null) return { ok: false, error: 'Cell already taken' };
    board[mv.index] = markForSide(side);

    const w = winner(board);
    const isDraw = !w && board.every((c) => c != null);

    const next: StartState = {
      status: w || isDraw ? 'ended' : 'active',
      nextTurn: w || isDraw ? state.nextTurn : otherSide(side),
      snapshot: { board }
    };

    if (w) {
      return { ok: true, state: next, end: { winnerSide: w === 'X' ? 'p1' : 'p2', reason: 'ttt_win' } };
    }
    if (isDraw) return { ok: true, state: next, end: { reason: 'ttt_draw' } };
    return { ok: true, state: next };
  }
};

