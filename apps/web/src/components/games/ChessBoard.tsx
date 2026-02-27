'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui';

type ChessSnapshot = { fen: string; turn: 'w' | 'b'; pgn: string };

const PIECES: Record<string, string> = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔'
};

function fenBoard(fen: string): (string | null)[] {
  const placement = fen.split(' ')[0] ?? '';
  const rows = placement.split('/');
  const out: (string | null)[] = [];
  for (const row of rows) {
    for (const ch of row) {
      if (/\d/.test(ch)) {
        const n = Number(ch);
        for (let i = 0; i < n; i++) out.push(null);
      } else {
        out.push(ch);
      }
    }
  }
  return out.length === 64 ? out : Array.from({ length: 64 }, () => null);
}

function idxToSquare(idx: number): string {
  const file = 'abcdefgh'[idx % 8]!;
  const rank = String(8 - Math.floor(idx / 8));
  return `${file}${rank}`;
}

export function ChessBoard(props: {
  snapshot: ChessSnapshot;
  canMove: boolean;
  onMove: (m: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }) => void;
}) {
  const board = useMemo(() => fenBoard(props.snapshot.fen), [props.snapshot.fen]);
  const [fromIdx, setFromIdx] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<'q' | 'r' | 'b' | 'n'>('q');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-0.5 rounded-xl overflow-hidden border border-white/10 bg-black/20">
        {board.map((piece, idx) => {
          const isDark = (Math.floor(idx / 8) + (idx % 8)) % 2 === 1;
          const selected = fromIdx === idx;
          return (
            <button
              key={idx}
              disabled={!props.canMove}
              onClick={() => {
                if (!props.canMove) return;
                if (fromIdx == null) {
                  setFromIdx(idx);
                  return;
                }
                const from = idxToSquare(fromIdx);
                const to = idxToSquare(idx);
                setFromIdx(null);
                props.onMove({ from, to, promotion });
              }}
              className={clsx(
                'aspect-square flex items-center justify-center text-2xl sm:text-3xl transition',
                isDark ? 'bg-[#0b1124]' : 'bg-[#101a36]',
                selected && 'outline outline-2 outline-neon/70'
              )}
              title={idxToSquare(idx)}
            >
              <span className={clsx(piece ? 'opacity-95' : 'opacity-0')}>{piece ? PIECES[piece] : '·'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted">
          Turn: <span className="text-text font-medium">{props.snapshot.turn === 'w' ? 'White (p1)' : 'Black (p2)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted">Promo</div>
          <select
            value={promotion}
            onChange={(e) => setPromotion(e.target.value as any)}
            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-sm"
          >
            <option value="q">Queen</option>
            <option value="r">Rook</option>
            <option value="b">Bishop</option>
            <option value="n">Knight</option>
          </select>
          <Button variant="ghost" onClick={() => setFromIdx(null)}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

