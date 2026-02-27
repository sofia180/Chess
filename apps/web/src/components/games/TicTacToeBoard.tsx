'use client';

import clsx from 'clsx';

type Cell = null | 'X' | 'O';
type Snapshot = { board: Cell[] };

export function TicTacToeBoard(props: { snapshot: Snapshot; canMove: boolean; onMove: (m: { index: number }) => void }) {
  const board = props.snapshot.board ?? Array.from({ length: 9 }, () => null);
  return (
    <div className="grid grid-cols-3 gap-2">
      {board.map((c, idx) => (
        <button
          key={idx}
          disabled={!props.canMove || c != null}
          onClick={() => props.onMove({ index: idx })}
          className={clsx(
            'aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-semibold',
            'hover:bg-white/10 disabled:opacity-60'
          )}
        >
          {c ?? ''}
        </button>
      ))}
    </div>
  );
}

