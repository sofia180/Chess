'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Input } from '@/components/ui';

export default function ReferralPage() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'anon') router.push('/');
  }, [router, state.status]);

  const code = state.status === 'authed' ? state.user.referralCode : '';
  const webLink = useMemo(() => (code ? `${window.location.origin}/?ref=${encodeURIComponent(code)}` : ''), [code]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Referral</div>
        <div className="text-sm text-muted">Earn 10% of the platform fee from referred users’ games.</div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Your referral code</div>
        <Input readOnly value={code || '…'} />
        <div className="text-sm text-muted">
          Telegram deep link format (replace `YOUR_BOT`): <span className="text-text">t.me/YOUR_BOT?start=ref_{code || 'CODE'}</span>
        </div>
        <div className="text-sm text-muted">
          Web invite link: <span className="text-text break-all">{webLink || '…'}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={!code}
            onClick={async () => {
              await navigator.clipboard.writeText(code);
            }}
          >
            Copy code
          </Button>
          <Button
            disabled={!webLink}
            onClick={async () => {
              await navigator.clipboard.writeText(webLink);
            }}
          >
            Copy web link
          </Button>
        </div>
      </Card>
    </div>
  );
}

