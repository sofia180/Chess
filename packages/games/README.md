# `@tcg/games`

Server-authoritative game engines.

## Add a new game

1) Create `packages/games/src/<game>/engine.ts` implementing `ServerGameEngine`.
2) Export it from `packages/games/src/index.ts`.
3) Update server `GAME_ENGINES` map in `apps/server/src/modules/games/registry.ts`.

