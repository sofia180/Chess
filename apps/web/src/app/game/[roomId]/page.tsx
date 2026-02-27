'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useSocket } from '@/components/SocketProvider';
import { Button, Card } from '@/components/ui';
import { ChessBoard } from '@/components/games/ChessBoard';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { state: auth } = useAuth();
  const { socket, connected, lastStartByRoom, lastStateByRoom, lastEndByRoom } = useSocket();

  const start = lastStartByRoom[roomId];
  const state = lastStateByRoom[roomId] ?? start?.state;
  const ended = lastEndByRoom[roomId];

  const youAre = start?.youAre;
  const gameType = start?.gameType;

  const canMove = useMemo(() => {
    if (!start || !state) return false;
    if (ended) return false;
    if (state.status !== 'active') return false;
    return state.nextTurn === youAre;
  }, [ended, start, state, youAre]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status === 'anon') router.push('/');
  }, [auth.status, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted">Room</div>
          <div className="text-xl font-semibold break-all">{roomId}</div>
          <div className="text-sm text-muted mt-1">
            Socket: <span className="text-text">{connected ? 'connected' : 'offline'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              router.push('/lobby');
            }}
          >
            Back
          </Button>
          <Button
            variant="danger"
            disabled={!socket}
            onClick={() => {
              setError(null);
              socket?.emit('resign', { roomId }, (resp) => {
                if (!resp.ok) setError(resp.error);
              });
            }}
          >
            Resign
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      {!start ? (
        <Card className="p-4">
          <div className="font-medium">Waiting for match…</div>
          <div className="text-sm text-muted mt-1">
            If you created a room, share the room id with a friend or wait for matchmaking to find an opponent.
          </div>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium capitalize">{start.gameType}</div>
              <div className="text-sm text-muted">
                Stake: <span className="text-text">{start.stakeAmount}</span> {start.stakeAsset} · You are{' '}
                <span className="text-text">{start.youAre}</span>
              </div>
              <div className="text-sm text-muted">
                Opponent:{' '}
                <span className="text-text">{start.opponent.username ? `@${start.opponent.username}` : start.opponent.userId}</span>
              </div>
            </div>
            <div className="text-sm">
              {ended ? (
                <span className="text-danger">Game ended</span>
              ) : canMove ? (
                <span className="text-neon">Your move</span>
              ) : (
                <span className="text-muted">Opponent’s move</span>
              )}
            </div>
          </div>

          {gameType === 'chess' && state?.snapshot?.fen ? (
            <ChessBoard
              snapshot={state.snapshot}
              canMove={!!socket && canMove}
              onMove={(m) => {
                setError(null);
                socket?.emit('move', { roomId, move: m }, (resp) => {
                  if (!resp.ok) setError(resp.error);
                });
              }}
            />
          ) : null}

          {gameType === 'tictactoe' && state?.snapshot?.board ? (
            <TicTacToeBoard
              snapshot={state.snapshot}
              canMove={!!socket && canMove}
              onMove={(m) => {
                setError(null);
                socket?.emit('move', { roomId, move: m }, (resp) => {
                  if (!resp.ok) setError(resp.error);
                });
              }}
            />
          ) : null}

          {!gameType && <div className="text-sm text-muted">Waiting for server to start the game…</div>}
        </Card>
      )}

      {ended && (
        <Card className="p-4 space-y-2">
          <div className="font-medium">Result</div>
          <div className="text-sm text-muted">
            Reason: <span className="text-text">{ended.reason}</span>
          </div>
          <div className="text-sm text-muted">
            Winner: <span className="text-text">{ended.winnerUserId ?? 'Draw'}</span>
          </div>
          {ended.payout && (
            <div className="text-sm text-muted">
              Payout: <span className="text-text">{ended.payout.amount}</span> {ended.payout.asset} · Fee:{' '}
              <span className="text-text">{ended.payout.feeAmount}</span>
              {ended.payout.referralRewardAmount ? (
                <>
                  {' '}
                  · Referral: <span className="text-text">{ended.payout.referralRewardAmount}</span>
                </>
              ) : null}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

