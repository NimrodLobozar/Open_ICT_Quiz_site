# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Open ICT Quiz

Live classroom quiz (Kahoot-style): a host shows the quiz on a big screen, students join with a lobby code on their laptop or phone.

Stack: React 19 + Vite + antd + react-router (frontend, `src/`), Express 5 + Socket.IO (backend, `backend/`), PostgreSQL 16 via Prisma 7 (`prisma/schema.prisma`). Plain JavaScript (ES modules), no TypeScript, no linter configured.

## Commands

- `docker compose up --build`: the normal way to run everything. Frontend http://localhost:5173, API http://localhost:3000, Postgres on host port 5433 (5432 inside Docker), Adminer http://localhost:8080 (server `db`, user/password/database `quiz`), Mailpit http://localhost:8025 (catches every mail in development). Code is mounted, so no rebuild needed for code changes (Vite HMR; nodemon restarts the backend and runs `prisma db push` + `prisma generate` on schema changes).
- After `package.json` changes: `docker compose up -d --build -V` (`-V` is required, otherwise the old `node_modules` volume is kept).
- Reset the database: `docker compose down -v`. Backend/schema errors show in `docker compose logs backend`.
- Without Docker: `npm run server` (API, needs `DATABASE_URL`, see `.env.example`) and `npm run dev` (Vite proxies `/api` and `/socket.io` to `API_PROXY_TARGET`, default `http://localhost:3000`).
- Tests: `npm test` (unit, no DB). Single file: `npx vitest run backend/tests/ranking.test.js`; single test: add `-t "<test name>"`. `npm run test:api` runs the API tests against a separate `quiz_test` database (Docker must run; never point it at `quiz`). `npm run test:smoke` plays the whole flow against the test backend on port 3001, which it starts itself (`SMOKE_URL` for another host).
- There are no migrations yet: the schema is applied with `prisma db push`. Live games are in memory; the DB only stores finished rounds (`GameSession` + `GameResult`), written once at the podium by `backend/db/gameResults.js`. See `docs/DATABASE.md`.

## Conventions

- All UI text is in Dutch. Code comments are in Dutch too, written for students learning the codebase: short and explaining *why*.
- Branches: `main` ← `dev` ← feature branches (`feature_<Naam>` or `<ticket>-<Naam>`). Open PRs against `dev`, not `main`.
- Commit messages use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).
- Shared styling lives in `src/index.css` (imported once in `main.jsx`, so it applies to every page): the colour variables `--quiz-*`, page background, text colour and font, plus the `.page` / `.page__main` layout. Don't redefine the colours per page; use `var(--quiz-...)`. `index.css` is imported before `App` in `main.jsx`, so page CSS wins on equal selectors (pages override `.page__main` width/padding in their own CSS).
- Every page is `<div className="page <name>">` + `<QuizHeader code={...} />` (add `large` on the host big screen) + `<main className="page__main <name>__main">`. Never build a page-specific nav bar or set the page background. Host big-screen pages also add `<PageRings />` (background circles) as the first child.
- New pages start as a copy of `src/pages/_Template/` (nav bar `QuizHeader` already included; view it at `/template`). Rename the files and the `template-page` class, then add a route in `src/App.jsx`.

## Accounts (sprint 2)

- See `docs/ACCOUNTS.md`. Roles `STUDENT`/`TEACHER`/`ADMIN` (enum on `User`); sessions are DB rows (`Session`, sha256 of the `quiz_auth` cookie token), not JWT. `loadUser` sets `request.user` on every `/api` request; protect routes with `requireAuth` / `requireRole(...)` from `backend/auth/middleware.js`. Frontend: `useAuth()` and `<RequireAuth roles>` in `src/auth/`.
- Never return a user row directly; use `publicUser()`. Throw `ApiError(code, message, status)` (`backend/utils/ApiError.js`) for user-facing errors.
- Dev admin is seeded from `SEED_ADMIN_*` in `docker-compose.yml` (`beheerder@quiz.local` / `Beheerder123`).
- Mail: `backend/mail/sendMail.js` sends via SMTP (nodemailer). In Docker the default is Mailpit; real mail (Brevo) is set with `SMTP_*` / `MAIL_FROM` in a git-ignored `.env`, see `docs/MAIL.md`. Without `SMTP_HOST` mails are logged (dev); in tests they go to the in-memory `outbox` (`tokenFromMail` in the API test helpers). `npm run test:smoke` / `test:visual` start a second backend (`backend-test`, profile `test`, port 3001) via `scripts/with-test-backend.mjs`; it reads mail settings from the committed `test.env` (always Mailpit) instead of `.env`, so tests never send real mail and read the links from Mailpit.
- Only HU addresses (`isHuEmail` in `src/utils/schoolEmail.js`, shared). New students must confirm their e-mail (`User.emailVerifiedAt`) before they can log in; `makeUser` in tests creates verified users by default.
- `// USER IMPLEMENTATION (S1..S12)` marks code the user writes themselves (guide: `docs/SPRINT-2-ZELF-IMPLEMENTEREN.md`). Don't fill these in unless asked; when asked to check them, compare against the guide and run `npm test`, `npm run test:api`, `npm run test:smoke`.

## Ranking

- `src/utils/ranking.js` (`getRanking`) is the single source for places. Podium and scoreboard must both use it so they always agree.
- Equal score = shared place (1, 2, 2, 4…). Within a tie, sort by nickname so the order is stable.

## Designs

- End-screen designs (10 styles × host big screen / student desktop / student phone) live in `.claude/designs/eindscherm/`. Open `index.html` there in a browser to see them all; it works offline from a git checkout.
- `src/` holds the design-canvas sources (`*.dc.html`); `previews/` and `index.html` are generated from them with `node .claude/designs/eindscherm/render.cjs`. Edit the sources, then rerun the script — don't hand-edit the previews.
- The editable online canvas is https://claude.ai/artifact/DYQLfMYVaoqjGKCUZ89XHf. After changing it, copy the updated `project/*` files into `src/` and rerun the script.
- New design work goes in its own folder under `.claude/designs/`.
- `.claude/designs/eindscherm-quizshow/` holds lighter, lower-contrast colour variants of design 7 (quizshow), including one on the `/lobby` background. Its second canvas page ("Volledige flow · 3 & 4") has every screen of the user flow (host big screen, student desktop, student phone) for variants 3 and 4; the buttons link to the next screen. Same setup: edit `src/`, then run `node .claude/designs/eindscherm-quizshow/render.cjs`. The editable online canvas is https://claude.ai/artifact/CU4wB5XbDxmXAhZbLRqEY5. After changing it, copy the updated `project/*` files into `src/` and rerun the script.
- `.claude/designs/accounts/` holds the login, student account and admin portal designs (9 screens, orange quiz style; roles student / docent / beheerder). The user stories and tasks for them are in `docs/USER-STORIES-SPRINT-2.md`. Same setup: edit `src/`, then run `node .claude/designs/accounts/render.cjs`. The editable online canvas is https://claude.ai/artifact/BqhGC5qi1hAxFUk9SdMQC5. After changing it, copy the updated `project/*` files into `src/` and rerun the script.

## Realtime (Socket.IO)

- Games live in memory on the server (`backend/game/`); REST in `backend/routes/games.js` sets/clears the httpOnly session cookies, Socket.IO (`backend/socket/`) does everything live. See `docs/SOCKET-IO-UITLEG.md` and the contract in `docs/SOCKET-EVENTS.md`.
- Event names live in `backend/socket/events.js` and a copy in `src/socket/events.js`; change both plus `docs/SOCKET-EVENTS.md` together.
- `src/utils/` (ranking, playerResult) is shared with the backend; Docker mounts it into the backend container.
- `Game` (`backend/game/Game.js`) is pure state with no Socket.IO/Express knowledge, so it can be unit-tested and shared by REST and sockets. Rule violations throw `GameError(code, message, status)`. `GameManager` holds all games and the session tokens behind the cookies. Phases are constants in `backend/game/phases.js`. The question loop is built: `LOBBY` → (`host:start`, min. 2 players) → per question `QUESTION_PREVIEW` → `QUESTION_ACTIVE` → `QUESTION_RESULT` (result + standings on one screen) → `PODIUM`; `LEADERBOARD` is unused. `Game` takes `now` as a parameter instead of reading the clock; the timers live in `backend/socket/gameLoop.js`. Questions are hard-coded in `backend/game/quizQuestions.js` until there is a Quiz table; scoring is `src/utils/scoring.js`.
- Socket auth: `sessionMiddleware` resolves the cookie + `handshake.auth { code, role }` into `socket.data`; sockets join rooms from `backend/socket/rooms.js` (game, host, per-player). After every (re)connect the client emits `game:sync` and rebuilds its view from the ack (`buildSyncState`), which is how page refreshes work.
- Frontend: one shared socket in `src/socket/socket.js` (`connectSocket`, `emitWithAck`), REST via `src/api/http.js`, listeners via `src/hooks/useSocketEvent.js`; the question events go through `src/hooks/useQuestionEvents.js` (shared by host and player). Convert `startsAt` from the server with `withLocalStartsAt` (`src/socket/serverTime.js`), because client clocks drift. Routes are in `src/App.jsx`; `/end`, `/end-player`, `/question`, `/question-answers`, `/leaderboard`, `/player-question` and `/player-result` are demos with fake data from `src/data/dummyDatabase.js` and `src/data/demoGame.js`. The real game uses the same screen components inside `HostGamePage` and `PlayerGamePage`.
- Dev only: `backend/game/devSimulation.js` (triggered by the host's `dev:finish` event) adds up to 100 bots and fakes all answers, to test the end screen with many players without playing 8 questions.
- Long-term plan (all events, phases, target schema): `Quizapp-Projectplan-Codebase.md`; code comments refer to it as "projectplan <section>".
