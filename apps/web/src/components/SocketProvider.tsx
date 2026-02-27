'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createAuthedSocket, type ServerToClientEvents, type ClientToServerEvents } from '@/lib/socket';
import { useAuth } from './AuthProvider';

export type StartGamePayload = Parameters<ServerToClientEvents['start_game']>[0];
export type MovePayload = Parameters<ServerToClientEvents['move']>[0];
export type GameEndPayload = Parameters<ServerToClientEvents['game_end']>[0];

type SocketCtx = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  lastStartByRoom: Record<string, StartGamePayload | undefined>;
  lastStateByRoom: Record<string, any>;
  lastEndByRoom: Record<string, GameEndPayload | undefined>;
};

const Ctx = createContext<SocketCtx | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { state: auth } = useAuth();
  const token = auth.status === 'authed' ? auth.token : null;
  const [connected, setConnected] = useState(false);
  const [lastStartByRoom, setLastStartByRoom] = useState<Record<string, StartGamePayload | undefined>>({});
  const [lastStateByRoom, setLastStateByRoom] = useState<Record<string, any>>({});
  const [lastEndByRoom, setLastEndByRoom] = useState<Record<string, GameEndPayload | undefined>>({});
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    if (socketRef.current) return;
    const socket = createAuthedSocket(token);
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('start_game', (payload) => {
      setLastStartByRoom((m) => ({ ...m, [payload.roomId]: payload }));
      setLastStateByRoom((m) => ({ ...m, [payload.roomId]: payload.state }));
    });
    socket.on('move', (payload) => {
      setLastStateByRoom((m) => ({ ...m, [payload.roomId]: payload.state }));
    });
    socket.on('game_end', (payload) => {
      setLastEndByRoom((m) => ({ ...m, [payload.roomId]: payload }));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [token]);

  const value = useMemo<SocketCtx>(
    () => ({
      socket: socketRef.current,
      connected,
      lastStartByRoom,
      lastStateByRoom,
      lastEndByRoom
    }),
    [connected, lastStartByRoom, lastStateByRoom, lastEndByRoom]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSocket() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('SocketProvider missing');
  return ctx;
}

