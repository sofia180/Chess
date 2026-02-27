# Deploy guide (MVP)

## Database

Use managed Postgres (recommended) or `docker-compose` locally:

```bash
docker compose up -d
```

## Backend (`apps/server`)

- Build and run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build -w @tcg/server
npm run start -w @tcg/server
```

- Set envs from `apps/server/.env.example`.

## Frontend (`apps/web`)

Deploy on Vercel or any Node host.

```bash
npm install
npm run build -w @tcg/web
npm run start -w @tcg/web
```

Set:
- `NEXT_PUBLIC_SERVER_URL`
- `NEXT_PUBLIC_SOCKET_URL`

## Telegram WebApp

1) Create a bot in BotFather and set `TELEGRAM_BOT_TOKEN`.
2) Configure your Web App URL in BotFather to your deployed `@tcg/web` URL.
3) Use deep links for referrals:
   - `t.me/YOUR_BOT?start=ref_<REFERRAL_CODE>`

