'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Input, Select } from '@/components/ui';

type Asset = 'USDT' | 'ETH' | 'POLYGON';
type Balance = { asset: Asset; balanceAvail: string; balanceLocked: string };

export default function WalletPage() {
  const { state } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [asset, setAsset] = useState<Asset>('USDT');
  const [amount, setAmount] = useState('10');
  const [address, setAddress] = useState('0x...');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const r = await api<{ ok: true; balances: Balance[] }>('/wallet/balances');
    setBalances(r.balances);
  }

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  useEffect(() => {
    if (state.status !== 'authed') return;
    refresh().catch((e) => setError(e.message));
  }, [state.status]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Wallet</div>
        <div className="text-sm text-muted">Internal balances (MVP mock deposit/withdraw adapter).</div>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="font-medium">Balances</div>
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="font-medium">Deposit (mock)</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={asset} onChange={(e) => setAsset(e.target.value as Asset)}>
              <option value="USDT">USDT</option>
              <option value="ETH">ETH</option>
              <option value="POLYGON">POLYGON</option>
            </Select>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
          </div>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await api('/wallet/deposit', { method: 'POST', body: JSON.stringify({ asset, amount }) });
                await refresh();
              } catch (e: any) {
                setError(e?.message ?? 'Deposit failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Deposit
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-medium">Withdraw (mock queue)</div>
          <div className="space-y-2">
            <Select value={asset} onChange={(e) => setAsset(e.target.value as Asset)}>
              <option value="USDT">USDT</option>
              <option value="ETH">ETH</option>
              <option value="POLYGON">POLYGON</option>
            </Select>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Destination address" />
          </div>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await api('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ asset, amount, address }) });
                await refresh();
              } catch (e: any) {
                setError(e?.message ?? 'Withdraw failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Request withdraw
          </Button>
        </Card>
      </div>
    </div>
  );
}

