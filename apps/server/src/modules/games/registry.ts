import { ChessEngine, TicTacToeEngine, type ServerGameEngine } from '@tcg/games';
import type { GameType } from '../../types';

export const GAME_ENGINES: Record<GameType, ServerGameEngine> = {
  chess: ChessEngine,
  tictactoe: TicTacToeEngine
};

