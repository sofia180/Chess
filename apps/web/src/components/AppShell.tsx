'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from './AuthProvider';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/lobby', label: 'Lobby' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/referral', label: 'Referral' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-black/20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-wide">
            TCG
          </Link>
          <div className="text-sm text-muted flex items-center gap-3">
            {state.status === 'authed' && (
              <>
                <span className="hidden sm:inline">Signed in</span>
                <button
                  onClick={logout}
                  className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
      </main>

      <nav className="sticky bottom-0 z-20 bg-panel/80 backdrop-blur border-t border-white/5">
        <div className="max-w-4xl mx-auto px-2 py-2 grid grid-cols-5 gap-1">
          {nav.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'text-xs sm:text-sm text-center px-2 py-2 rounded-md border',
                  active ? 'bg-white/10 border-white/20 text-text' : 'bg-transparent border-transparent text-muted hover:bg-white/5'
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

