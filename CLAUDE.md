# Open ICT Quiz

Live classroom quiz (Kahoot-style): a host shows the quiz on a big screen, students join with a lobby code on their laptop or phone.

## Conventions

- All UI text is in Dutch. Code comments are in Dutch too, written for students learning the codebase: short and explaining *why*.
- Branches: `main` ← `dev` ← feature branches (`feature_<Naam>` or `<ticket>-<Naam>`). Open PRs against `dev`, not `main`.
- Commit messages use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).

## Ranking

- `src/utils/ranking.js` (`getRanking`) is the single source for places. Podium and scoreboard must both use it so they always agree.
- Equal score = shared place (1, 2, 2, 4…). Within a tie, sort by nickname so the order is stable.

## Designs

- End-screen designs (10 styles × host big screen / student desktop / student phone) live in `.claude/designs/eindscherm/`. Open `index.html` there in a browser to see them all; it works offline from a git checkout.
- `src/` holds the design-canvas sources (`*.dc.html`); `previews/` and `index.html` are generated from them with `node .claude/designs/eindscherm/render.cjs`. Edit the sources, then rerun the script — don't hand-edit the previews.
- The editable online canvas is https://claude.ai/artifact/DYQLfMYVaoqjGKCUZ89XHf. After changing it, copy the updated `project/*` files into `src/` and rerun the script.
- New design work goes in its own folder under `.claude/designs/`.
- `.claude/designs/eindscherm-quizshow/` holds lighter, lower-contrast colour variants of design 7 (quizshow), including one on the `/lobby` background. Its second canvas page ("Volledige flow · 3 & 4") has every screen of the user flow (host big screen, student desktop, student phone) for variants 3 and 4; the buttons link to the next screen. Same setup: edit `src/`, then run `node .claude/designs/eindscherm-quizshow/render.cjs`. The editable online canvas is https://claude.ai/artifact/CU4wB5XbDxmXAhZbLRqEY5. After changing it, copy the updated `project/*` files into `src/` and rerun the script.

## Realtime (Socket.IO)

- Games live in memory on the server (`backend/game/`); REST in `backend/routes/games.js` sets/clears the httpOnly session cookies, Socket.IO (`backend/socket/`) does everything live. See `docs/SOCKET-IO-UITLEG.md` and the contract in `docs/SOCKET-EVENTS.md`.
- Event names live in `backend/socket/events.js` and a copy in `src/socket/events.js`; change both plus `docs/SOCKET-EVENTS.md` together.
- `src/utils/` (ranking, playerResult) is shared with the backend; Docker mounts it into the backend container.
- Tests: `npm test` (Vitest, `backend/tests/`).
