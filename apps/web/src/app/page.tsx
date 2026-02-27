'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Input } from '@/components/ui';
import { isInTelegram } from '@/lib/telegram';

export default function Page() {
  const { state, loginTelegram, loginDev } = useAuth();
  const sp = useSearchParams();
  const router = useRouter();

  const referralCode = useMemo(() => sp.get('ref') ?? undefined, [sp]);

  const [username, setUsername] = useState('player_' + Math.random().toString(36).slice(2, 6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm text-neon uppercase tracking-wider">Viral crypto gaming</div>
        <h1 className="text-3xl font-semibold leading-tight">Play friends or randoms with real stakes.</h1>
        <p className="text-muted">
          Deposit USDT/ETH/POLYGON (mock provider in MVP), lock stakes per game, server-authoritative gameplay, automatic
          payouts, and referral rewards.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="font-medium">Telegram Web App</div>
          <p className="text-sm text-muted">
            Open inside Telegram. We verify `initData` and issue a JWT for realtime games & wallet actions.
          </p>
          <Button
            disabled={busy || !isInTelegram()}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await loginTelegram();
                router.push('/dashboard');
              } catch (e: any) {
                setError(e?.message ?? 'Login failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            {isInTelegram() ? 'Continue in Telegram' : 'Open in Telegram to login'}
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-medium">Web version (Dev login)</div>
          <p className="text-sm text-muted">
            For MVP testing outside Telegram. In production you’d use Telegram OAuth/Deep-linking flow.
          </p>
          <div className="space-y-2">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            {referralCode && <div className="text-xs text-muted">Referral: <span className="text-text">{referralCode}</span></div>}
          </div>
          <Button
            disabled={busy || username.length < 3}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await loginDev({ username, referralCode });
                router.push('/dashboard');
              } catch (e: any) {
                setError(e?.message ?? 'Login failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Enter app
          </Button>
        </Card>
      </div>

      {error && <div className="text-sm text-danger">{error}</div>}

      <Card className="p-4">
        <div className="text-sm text-muted">
          Status: <span className="text-text">{state.status}</span>
        </div>
      </Card>
    </div>
  );
}

