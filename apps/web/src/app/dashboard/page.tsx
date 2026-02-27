'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card } from '@/components/ui';

type Balance = { asset: 'USDT' | 'ETH' | 'POLYGON'; balanceAvail: string; balanceLocked: string };

export default function DashboardPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  useEffect(() => {
    if (state.status !== 'authed') return;
    api<{ ok: true; balances: Balance[] }>('/wallet/balances')
      .then((r) => setBalances(r.balances))
      .catch((e) => setError(e.message));
  }, [state.status]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-muted">Your wallet</div>
          <div className="text-2xl font-semibold">Dashboard</div>
        </div>
        <Button variant="ghost" onClick={() => router.push('/lobby')}>
          Play now
        </Button>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4">
        <div className="font-medium mb-3">Balances</div>
        {!balances ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {balances.map((b) => (
              <div key={b.asset} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="text-sm text-muted">{b.asset}</div>
                <div className="text-lg font-semibold">{b.balanceAvail}</div>
                <div className="text-xs text-muted">Locked: {b.balanceLocked}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="font-medium">Featured</div>
        <div className="text-sm text-muted mt-1">Chess and Tic Tac Toe with stakes + matchmaking.</div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => router.push('/lobby?game=chess')}>Chess lobby</Button>
          <Button variant="ghost" onClick={() => router.push('/lobby?game=tictactoe')}>
            Tic Tac Toe lobby
          </Button>
        </div>
      </Card>
    </div>
  );
}

