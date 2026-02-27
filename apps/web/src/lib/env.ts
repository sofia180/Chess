export const env = {
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000'
};

