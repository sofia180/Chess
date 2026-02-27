'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useSocket } from '@/components/SocketProvider';
import { Button, Card, Input, Select } from '@/components/ui';

type GameType = 'chess' | 'tictactoe';
type Asset = 'USDT' | 'ETH' | 'POLYGON';

export default function LobbyPage() {
  const { state } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();
  const sp = useSearchParams();

  const initialGame = useMemo(() => (sp.get('game') === 'tictactoe' ? 'tictactoe' : 'chess') as GameType, [sp]);

  const [gameType, setGameType] = useState<GameType>(initialGame);
  const [stakeAsset, setStakeAsset] = useState<Asset>('USDT');
  const [stakeAmount, setStakeAmount] = useState('10');
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  useEffect(() => {
    if (roomId) router.push(`/game/${roomId}`);
  }, [roomId, router]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Lobby</div>
        <div className="text-sm text-muted">Matchmaking pairs players with same game + stake.</div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="font-medium">Game settings</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <Select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)}>
            <option value="chess">Chess</option>
            <option value="tictactoe">Tic Tac Toe</option>
          </Select>
          <Select value={stakeAsset} onChange={(e) => setStakeAsset(e.target.value as Asset)}>
            <option value="USDT">USDT</option>
            <option value="ETH">ETH</option>
            <option value="POLYGON">POLYGON</option>
          </Select>
          <Input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Stake amount" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || !socket || !connected}
            onClick={async () => {
              setBusy(true);
              setError(null);
              setInviteCode(null);
              try {
                socket.emit('join_random', { gameType, stakeAsset, stakeAmount }, (resp) => {
                  if (!resp.ok) {
                    setError(resp.error);
                    setBusy(false);
                    return;
                  }
                  setRoomId(resp.roomId);
                  setBusy(false);
                });
              } catch (e: any) {
                setError(e?.message ?? 'Failed');
                setBusy(false);
              }
            }}
          >
            Join random match
          </Button>

          <Button
            variant="ghost"
            disabled={busy || !socket || !connected}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                socket.emit('create_room', { gameType, stakeAsset, stakeAmount, isPrivate: true }, (resp) => {
                  if (!resp.ok) {
                    setError(resp.error);
                    setBusy(false);
                    return;
                  }
                  setInviteCode(resp.inviteCode ?? null);
                  setRoomId(resp.roomId);
                  setBusy(false);
                });
              } catch (e: any) {
                setError(e?.message ?? 'Failed');
                setBusy(false);
              }
            }}
          >
            Create private room
          </Button>
        </div>

        {inviteCode && (
          <div className="text-sm text-muted">
            Invite code: <span className="text-text font-semibold">{inviteCode}</span>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Join by room id or invite code</div>
        <div className="flex gap-2">
          <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Room id or invite code" />
          <Button
            disabled={busy || joinCode.length < 6 || !socket || !connected}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const trimmed = joinCode.trim();
                const isInvite = /^[A-Z0-9]{6,10}$/i.test(trimmed) && trimmed.length <= 10;
                socket.emit('join_room', isInvite ? { inviteCode: trimmed } : { roomId: trimmed }, (resp) => {
                  if (!resp.ok) {
                    setError(resp.error);
                    setBusy(false);
                    return;
                  }
                  setRoomId(resp.roomId);
                  setBusy(false);
                });
              } catch (e: any) {
                setError(e?.message ?? 'Failed');
                setBusy(false);
              }
            }}
          >
            Join
          </Button>
        </div>
      </Card>
    </div>
  );
}

