import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AppShell } from '@/components/AppShell';
import { SocketProvider } from '@/components/SocketProvider';

export const metadata: Metadata = {
  title: 'Telegram Crypto Gaming',
  description: 'Play mini-games with crypto stakes.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SocketProvider>
            <AppShell>{children}</AppShell>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

