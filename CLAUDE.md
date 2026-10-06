# CLAUDE.md

Kahoot-achtige quizwebsite voor HU Open ICT (squad-project, beginners). Volledig plan: `docs/PROJECTPLAN.md`. Event-contract: `docs/SOCKET-EVENTS.md`.

## Status

Skeleton (projectplan Fase 0–2) is klaar. **Fase 3+ (MVP-features) bouwt het team zelf** — bouw die alleen als daar expliciet om gevraagd wordt. Zoek naar `TODO(team` voor openstaand werk.

## Stack

- `client/`: React 19 + Vite + Ant Design 6 + React Router 7 + socket.io-client + qrcode.react. JavaScript (geen TypeScript).
- `server/`: Node 24 + Express 5 + Socket.IO 4 + Prisma 7 (`prisma-client-js` + `@prisma/adapter-pg`) + PostgreSQL 17. ES modules. Vitest.
- Prisma 7: datasource-URL en seed-commando staan in `server/prisma.config.js`, niet in `schema.prisma`.
- Alles draait in Docker Compose (`db`, `server`, `client`, `adminer`). Niets lokaal installeren.

## Commando's

```bash
docker compose up --build                      # alles starten (migreert + seedt automatisch)
docker compose exec server npm test            # unit tests (vitest)
docker compose exec server npm run lint
docker compose exec client npm run lint
docker compose exec server npx prisma migrate dev --name <naam>
docker compose exec server npx prisma db seed
docker compose up --build -V                   # na nieuwe packages
```

Poorten: client 5173 (proxyt `/api` en `/socket.io` naar server), server 3000, Postgres 5432, Adminer 8080.

## Architectuur

- Actieve games leven **in geheugen** (`server/src/game/GameManager.js`: `games` Map + `sessions` Map token → `{ gameCode, playerId, role }`). Resultaten gaan pas aan het eind naar de DB.
- **Server-authoritative**: server houdt timer bij, controleert antwoorden, berekent punten. Stuur `isCorrect` nooit naar clients vóór de vraag voorbij is.
- **Sessies uitsluitend via httpOnly-cookies** (`quiz_host`, `quiz_player`, later `quiz_auth`), altijd via `server/src/utils/cookies.js`. Nooit `localStorage`/`sessionStorage` voor identiteit. Cookie bevat alleen een random token.
- REST (`server/src/routes/games.js`) voor sessie starten/beëindigen (zet cookies). Socket.IO voor alles wat live is.
- Socket-verbinding: client zet `socket.auth = { gameCode, role }` en verbindt pas na een geslaagde sessie-check. `server/src/socket/sessionMiddleware.js` leest de cookie, zet `socket.data` en joint rooms (`code`, `code:host`, `code:player:<id>`). Geen join-events.
- `server/src/game/Game.js`: state machine per game, weet niets van Socket.IO/Express, gooit `GameError` (`server/src/constants/errors.js`). Socket-handlers gebruiken `withAck()` zodat elke actie `{ ok, ... }` of `{ ok: false, error, message }` teruggeeft.
- Volledig geïmplementeerd + getest: `nameRules.js`, `scoring.js`, `codeGenerator.js`, sessie-/rejoin-mechanisme, `lobby:update`, `host:lock`, `host:end`. Stubs: `Game.start/submitAnswer/nextPhase/restart/getRanking`.

## Conventies

- Engelse namen voor code/bestanden, **Nederlandstalig** commentaar en UI-teksten.
- Simpel en leesbaar voor beginners: korte bestanden, geen slimmigheden.
- Componenten `PascalCase.jsx`, hooks `useCamelCase.js`, rest `camelCase.js`. Eén component per bestand.
- antd-componenten gebruiken; kleuren alleen in `client/src/theme.js`.
- Eventnamen nooit als string: altijd via `events.js`. Client en server hebben elk een **kopie** (`server/src/constants/events.js`, `client/src/socket/events.js`) — wijzig beide + `docs/SOCKET-EVENTS.md`.
- Prettier (geen puntkomma's, enkele quotes, printWidth 100) + ESLint.
- Plekken waar het team verder moet: `// TODO(team, Fase X): ...` met uitleg.
- Git: feature branches + PR naar `main`, commitberichten in gebiedende wijs (Nederlands).
