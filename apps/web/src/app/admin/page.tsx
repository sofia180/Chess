'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { env } from '@/lib/env';
import { Button, Card, Input } from '@/components/ui';

export default function AdminPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [key, setKey] = useState('');
  const [stats, setStats] = useState<{ users: number; games: number; revenueTotal: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  async function load() {
    setError(null);
    setStats(null);
    const res = await fetch(`${env.serverUrl}/admin/stats`, {
      headers: { 'x-admin-key': key }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Unauthorized');
    setStats({ users: json.users, games: json.games, revenueTotal: json.revenueTotal });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Admin</div>
        <div className="text-sm text-muted">MVP admin endpoints protected by `x-admin-key`.</div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="font-medium">Admin API key</div>
        <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        <Button disabled={!key} onClick={() => load().catch((e) => setError(e.message))}>
          Load stats
        </Button>
      </Card>

      {stats && (
        <Card className="p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-sm text-muted">Users</div>
              <div className="text-xl font-semibold">{stats.users}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-sm text-muted">Games</div>
              <div className="text-xl font-semibold">{stats.games}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-sm text-muted">Revenue (sum fees)</div>
              <div className="text-xl font-semibold">{stats.revenueTotal}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

