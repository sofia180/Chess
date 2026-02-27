'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { Card } from '@/components/ui';

type Row = { userId: string; username: string | null; wins: number };

export default function LeaderboardPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  useEffect(() => {
    api<{ ok: true; rows: Row[] }>('/leaderboard/top')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Leaderboard</div>
        <div className="text-sm text-muted">Top winners (by match wins).</div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4">
        {!rows ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted">No completed games yet.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.userId} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-xs">{i + 1}</div>
                  <div>
                    <div className="font-medium">{r.username ? `@${r.username}` : r.userId}</div>
                    <div className="text-xs text-muted">{r.userId}</div>
                  </div>
                </div>
                <div className="text-sm text-muted">
                  Wins: <span className="text-text font-semibold">{r.wins}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

