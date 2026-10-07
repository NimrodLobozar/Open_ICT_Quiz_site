# Referentie: leeggehaalde pagina's

De pagina's hieronder zijn **leeggehaald** zodat het team ze zelf kan bouwen. De originele
skeleton-code staat als voorbeeld in `docs/reference/pages/`. Die map wordt **niet** door de app
gebruikt (staat buiten `client/`, dus Vite en ESLint kijken er niet naar).

Elke pagina in `client/src/pages/` is nu een kort stub-bestand met een `TODO(team, …)`-blok:
**daar moet je werken.** De routes in `client/src/App.jsx` zijn hetzelfde gebleven, dus de app
blijft werken — je ziet alleen een placeholder in plaats van de pagina.

## Overzicht

| Route | Werken in (stub) | Referentie | Flow in projectplan | Fase / persoon |
|---|---|---|---|---|
| `/quizzes` | `client/src/pages/QuizBrowsePage.jsx` | `pages/QuizBrowsePage.jsx` | 3.1 stap 2 | Fase 1–2 afmaken (A) |
| `/host/new/:quizId` | `client/src/pages/HostSetupPage.jsx` | `pages/HostSetupPage.jsx` | 3.1 stap 3 | Fase 1–2 afmaken (A) |
| `/host/:code` | `client/src/pages/HostGamePage.jsx` | `pages/HostGamePage.jsx` | 3.1 stap 4–10 | Fase 3–6 (B, D, E) |
| `/join` + `/join/:code` | `client/src/pages/JoinPage.jsx` | `pages/JoinPage.jsx` | 3.2 stap 1–2 | Fase 3 (B) |
| `/play/:code` | `client/src/pages/PlayerGamePage.jsx` | `pages/PlayerGamePage.jsx` | 3.2 stap 3–6 | Fase 4–6 (D, E) |

Niet aangeraakt (die blijven zoals ze waren):

- `HomePage.jsx`, `NotFoundPage.jsx`, `SocketTestPage.jsx` (`/dev/socket`), `AppLayout.jsx`.
- Alle **componenten** in `client/src/components/`. `PlayerList`, `JoinQrCode` en `AnswerButtons`
  zijn al werkend; `Leaderboard`, `Podium`, `Scoreboard` en `QuestionTimer` zijn stubs met hun
  eigen `TODO(team)`.
- Alle **hooks** (`useGameSession`, `useGameSocket`, `useSocketEvent`), `api/http.js`,
  `socket/socket.js` en `socket/events.js`.
- De hele **server** (`server/`). Daar zijn alleen `Game.start`, `submitAnswer`, `nextPhase`,
  `restart` en `getRanking` nog stubs — zie `TODO(team` in `server/src/game/Game.js`.

## Let op: hier zat al werkende code in

Twee dingen die in de skeleton al **af** waren, staan nu alleen nog in de referentie. Als je aan
die pagina's begint, is dit de logische eerste stap om over te nemen:

1. **Sessie-check + rejoin** (`useGameSession` + `useGameSocket`) in `HostGamePage`,
   `PlayerGamePage` en `JoinPage` (stap 2). Dit is het voorbeeld van het cookie-mechanisme uit
   projectplan 6.1: de socket verbindt pas ná een geslaagde sessie-check.
2. **De lobby** in `HostGamePage`: joincode + QR, live spelerslijst via `lobby:update`,
   `host:lock` en `host:end`. En in `JoinPage`: naam invullen via
   `POST /api/games/:code/players`, inclusief de foutmeldingen `NAME_TAKEN` / `NAME_INVALID`.

## Hoe gebruik je de referentie?

- **Kijken en zelf typen** is het doel — zo leer je het meest.
- Kopiëren mag, maar kopieer dan per stuk (eerst de sessie-check, dan de lobby, …) en zorg dat je
  snapt wat elke regel doet. Haal het `// REFERENTIE`-blok bovenaan weg als je kopieert.
- Het event-contract staat in `docs/SOCKET-EVENTS.md`; eventnamen altijd importeren uit
  `client/src/socket/events.js` (nooit als losse string).
- De referentiebestanden hoef je niet bij te werken. Als een pagina klaar is, mag het
  bijbehorende bestand in `docs/reference/pages/` weg (in een eigen commit).
