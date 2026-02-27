import { Chess } from 'chess.js';
import type { ApplyMoveResult, ServerGameEngine, StartState } from '../types.js';

type ChessSnapshot = {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
};

type ChessMoveInput =
  | { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }
  | { uci: string };

function snapshotFrom(chess: Chess): ChessSnapshot {
  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn(),
    isGameOver: chess.isGameOver()
  };
}

function sideToTurn(side: 'p1' | 'p2'): 'w' | 'b' {
  return side === 'p1' ? 'w' : 'b';
}

function nextTurnToSide(turn: 'w' | 'b'): 'p1' | 'p2' {
  return turn === 'w' ? 'p1' : 'p2';
}

function parseUci(uci: string): { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' } {
  const trimmed = uci.trim();
  if (trimmed.length < 4) throw new Error('Invalid UCI');
  const from = trimmed.slice(0, 2);
  const to = trimmed.slice(2, 4);
  const promo = trimmed.slice(4, 5) as 'q' | 'r' | 'b' | 'n' | '';
  return promo ? { from, to, promotion: promo } : { from, to };
}

export const ChessEngine: ServerGameEngine = {
  gameType: 'chess',
  create(): StartState {
    const chess = new Chess();
    return {
      status: 'active',
      nextTurn: 'p1',
      snapshot: snapshotFrom(chess)
    };
  },
  applyMove({ state, side, move }): ApplyMoveResult {
    if (state.status !== 'active') return { ok: false, error: 'Game is not active' };

    const snap = state.snapshot as ChessSnapshot;
    const chess = new Chess(snap.fen);

    if (chess.turn() !== sideToTurn(side)) {
      return { ok: false, error: 'Not your turn' };
    }

    if (typeof move !== 'object' || move == null) return { ok: false, error: 'Invalid move' };
    let mv: ChessMoveInput;
    mv = move as ChessMoveInput;

    const applied = (() => {
      try {
        if ('uci' in mv && typeof mv.uci === 'string') {
          const parsed = parseUci(mv.uci);
          return chess.move(parsed);
        }
        if ('from' in mv && 'to' in mv && typeof mv.from === 'string' && typeof mv.to === 'string') {
          return chess.move({
            from: mv.from,
            to: mv.to,
            promotion: mv.promotion
          });
        }
        return null;
      } catch {
        return null;
      }
    })();

    if (!applied) return { ok: false, error: 'Illegal move' };

    const next: StartState = {
      status: chess.isGameOver() ? 'ended' : 'active',
      nextTurn: chess.isGameOver() ? state.nextTurn : nextTurnToSide(chess.turn()),
      snapshot: snapshotFrom(chess)
    };

    if (!chess.isGameOver()) return { ok: true, state: next };

    // Determine end reason/winner (simple MVP)
    if (chess.isCheckmate()) {
      const winnerSide = side; // mover delivered mate
      return { ok: true, state: next, end: { winnerSide, reason: 'checkmate' } };
    }
    if (chess.isStalemate()) return { ok: true, state: next, end: { reason: 'stalemate' } };
    if (chess.isInsufficientMaterial())
      return { ok: true, state: next, end: { reason: 'insufficient_material' } };
    if (chess.isThreefoldRepetition())
      return { ok: true, state: next, end: { reason: 'threefold_repetition' } };
    if (chess.isDraw()) return { ok: true, state: next, end: { reason: 'draw' } };

    return { ok: true, state: next, end: { reason: 'draw' } };
  }
};

