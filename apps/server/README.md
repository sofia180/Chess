# `@tcg/server`

Express + Socket.io backend with Prisma/Postgres.

## Features (MVP)

- **JWT auth** for web + sockets
- **Telegram WebApp login verification** via `initData` HMAC
- **Internal wallet ledger**: available + locked balances, deposits/withdrawals (mock adapters)
- **Stake locking** on match start, **server-authoritative moves**, automatic payout
- **Fee + referral rewards** (configurable bps)
- **Admin endpoints** protected by `x-admin-key`

## Env

Copy:

```bash
cp .env.example .env
```

Required:
- **DATABASE_URL**
- **JWT_SECRET**
- **TELEGRAM_BOT_TOKEN**
- **ADMIN_API_KEY**
- **WEB_ORIGIN** (for CORS)

## Run

From repo root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev:server
```

Server:
- HTTP: `http://localhost:4000`
- Socket.io: `http://localhost:4000`

## API (high-level)

- `GET /health`
- `POST /auth/telegram`
- `POST /auth/dev` (MVP)
- `GET /auth/me`
- `GET /wallet/balances`
- `GET /wallet/deposit-address?asset=USDT|ETH|POLYGON`
- `POST /wallet/deposit` (mock confirm)
- `POST /wallet/withdraw` (mock queue)
- `GET /leaderboard/top`
- `GET /admin/stats` (header `x-admin-key`)
- `GET /admin/users` (header `x-admin-key`)
- `POST /admin/ban` (header `x-admin-key`)
- `GET /admin/games` (header `x-admin-key`)

## Socket events

Client → Server:
- `create_room`
- `join_room`
- `join_random`
- `move`
- `resign`

Server → Client:
- `match_found`
- `start_game`
- `move`
- `game_end`

