'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/authToken';
import { getTelegramInitData, isInTelegram, telegramReady } from '@/lib/telegram';

type User = { id: string; username?: string | null; referralCode: string };

type AuthState =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'authed'; token: string; user: User };

type AuthContextValue = {
  state: AuthState;
  loginTelegram: () => Promise<void>;
  loginDev: (input: { username: string; referralCode?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const hydrate = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ status: 'anon' });
      return;
    }
    try {
      const res = await api<{ ok: true; user: User }>('/auth/me');
      setState({ status: 'authed', token, user: res.user });
    } catch {
      clearToken();
      setState({ status: 'anon' });
    }
  }, []);

  useEffect(() => {
    telegramReady();
    hydrate();
  }, [hydrate]);

  const loginTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) throw new Error('Telegram initData missing');
    const res = await api<{ ok: true; token: string; user: User }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
    setToken(res.token);
    setState({ status: 'authed', token: res.token, user: res.user });
  }, []);

  const loginDev = useCallback(async (input: { username: string; referralCode?: string }) => {
    const res = await api<{ ok: true; token: string; user: User }>('/auth/dev', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    setToken(res.token);
    setState({ status: 'authed', token: res.token, user: res.user });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ status: 'anon' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, loginTelegram, loginDev, logout }),
    [state, loginTelegram, loginDev, logout]
  );

  // auto-attempt telegram login if inside Telegram and anon/loading
  useEffect(() => {
    if (!isInTelegram()) return;
    if (state.status !== 'anon') return;
    loginTelegram().catch(() => {
      // stay anon; UI will show retry
    });
  }, [loginTelegram, state.status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}

