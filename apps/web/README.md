# `@tcg/web`

Next.js (App Router) UI for both:
- **Telegram Web App**
- **Web version**

## Env

Copy:

```bash
cp .env.example .env.local
```

Variables:
- `NEXT_PUBLIC_SERVER_URL`
- `NEXT_PUBLIC_SOCKET_URL`

## Run

From repo root:

```bash
npm install
npm run dev:web
```

Open:
- `http://localhost:3000`

## Pages

- `/` Telegram landing + dev login
- `/dashboard`
- `/wallet`
- `/lobby`
- `/game/:roomId`
- `/leaderboard`
- `/referral`
- `/admin`

