# Telegram Crypto Gaming MVP

Viral Telegram/Web crypto mini-games MVP:
- **Telegram Web App** (Next.js + Telegram WebApp SDK)
- **Web version** (same Next.js app)
- **Backend** (Express + Socket.io + Prisma/Postgres)
- **Games** (modular package: Chess via `chess.js`, Tic Tac Toe)

## Quick start

1) Install Node.js (recommended **Node 20+**) and PostgreSQL.

2) Create Postgres DB and copy envs:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

3) Install deps (from repo root):

```bash
npm install
```

4) Setup database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5) Run:

```bash
npm run dev:server
npm run dev:web
```

## Documentation

- **Server**: `apps/server/README.md`
- **Web**: `apps/web/README.md`
- **Adding games**: `packages/games/README.md`


