# Event-contract: REST + Socket.IO

Dit is het contract tussen client en server. Alle socket-eventnamen staan als constanten in
`server/src/constants/events.js` en (als kopie) in `client/src/socket/events.js`.

> **Wijzig je een eventnaam of payload?** Pas dan beide `events.js`-bestanden **én** dit document aan in dezelfde PR.

Status: ✅ = werkt in de skeleton · 🚧 = stub, bouwt het team (fase tussen haakjes).

## 1. REST-endpoints voor sessies

Alleen een HTTP-antwoord kan een cookie zetten. Daarom gaat alles wat een sessie start of beëindigt via REST.

| Status | Methode + pad | Body | Antwoord | Cookie |
|---|---|---|---|---|
| ✅ | `POST /api/games` | `{ quizId, settings: { maxPlayers, timePerQuestion, questionPreviewSeconds } }` | `201 { gameCode }` | zet `quiz_host` |
| ✅ | `GET /api/games/:code` | – | `{ exists, locked, phase, quizTitle }` | – |
| ✅ | `POST /api/games/:code/players` | `{ nickname }` | `201 { playerId, nickname }` (of `200` bij een bestaande sessie) | zet `quiz_player` |
| ✅ | `GET /api/games/:code/me?role=host\|player` | – | `{ role: 'host' }` of `{ role: 'player', playerId, nickname }`, anders `401 NO_SESSION` | leest beide |
| ✅ | `DELETE /api/games/:code/players/me` | – | `{ ok: true }` | wist `quiz_player` |

Fouten: passende HTTP-status met body `{ error, message }`, bijv. `404 GAME_NOT_FOUND`, `409 NAME_TAKEN`, `400 NAME_INVALID`, `403 LOBBY_LOCKED`, `403 LOBBY_FULL`.

Overige REST: `GET /api/health`, `GET /api/quizzes?search=`, `GET /api/quizzes/:id` (zonder `isCorrect`).

### Cookies

| Cookie | Voor | Inhoud | Geldig |
|---|---|---|---|
| `quiz_player` | speler | willekeurige token | 4 uur |
| `quiz_host` | host | willekeurige token | 4 uur |
| `quiz_auth` | (later, L1) account | JWT of token | 7 dagen |

Alle cookies: `httpOnly`, `sameSite: 'lax'`, `path: '/'`, altijd een `maxAge`, `secure` alleen in productie.
Instellen gaat altijd via `server/src/utils/cookies.js`.

## 2. Verbinden

De client verbindt de socket pas **na** een geslaagde aanmaak/join/`me`-check, en geeft mee welke game en rol hij bedoelt:

```js
socket.auth = { gameCode: '482913', role: 'player' } // of 'host'
socket.connect()
```

De `sessionMiddleware` leest de bijbehorende cookie, koppelt de socket aan de game (`socket.data = { gameCode, playerId, role }`) en zet hem in de juiste rooms. Ongeldige sessie → `connect_error` met `err.data = { error: 'NO_SESSION', message }`.

Er zijn dus **geen** socket-events voor joinen of rejoinen.

Na het verbinden stuurt de server `lobby:update` naar de hele room (de speler is nu online).

## 3. Client → Server

Elke actie gebruikt een **acknowledgement-callback**. Antwoord: `{ ok: true, ... }` of `{ ok: false, error: 'CODE', message: '...' }`.

| Status | Event | Van | Payload | Antwoord (ack) |
|---|---|---|---|---|
| ✅ | `host:lock` | host | `{ locked: true/false }` | `{ ok }` |
| 🚧 (3) | `host:kick` | host | `{ playerId }` (optioneel) | `{ ok }` |
| 🚧 (4) | `host:start` | host | `{}` | `{ ok }` |
| 🚧 (4/5) | `host:next` | host | `{}` | `{ ok }` |
| 🚧 (6) | `host:restart` | host | `{}` | `{ ok }` |
| ✅ | `host:end` | host | `{}` (lobby sluiten) | `{ ok }` |
| 🚧 (4) | `player:answer` | speler | `{ questionIndex, optionId }` | `{ ok }` (géén goed/fout) |
| ✅ | `game:sync` | host/speler | `{}` | `{ ok, state }` |
| ✅ | `dev:ping` | iedereen (dev) | `{}` | `{ ok, message: 'pong', serverTime }` |

**Foutcodes:** `GAME_NOT_FOUND`, `LOBBY_LOCKED`, `LOBBY_FULL`, `NAME_TAKEN`, `NAME_INVALID`, `ALREADY_ANSWERED`, `TOO_LATE`, `NOT_HOST`, `NO_SESSION`, `WRONG_PHASE`, `NOT_IMPLEMENTED` (stub), `INTERNAL`.

`game:sync` → `state` bevat nu: `{ code, quizTitle, phase, questionIndex, totalQuestions, settings, lobby, me? }`.
🚧 Het team voegt de huidige vraag en resterende tijd toe (zie `Game.getStateFor`).

## 4. Server → Client

| Status | Event | Naar | Payload |
|---|---|---|---|
| ✅ | `lobby:update` | iedereen in room | `{ players: [{ id, nickname, connected, isVerified, roles: [] }], locked, playerCount }` |
| 🚧 (4) | `game:phase` | iedereen | `{ phase, questionIndex, totalQuestions }` |
| 🚧 (4) | `question:show` | iedereen | `{ index, total, text, options: [{ id, text }], timeLimitSec, previewSeconds, startsAt }` (**zonder** `isCorrect`) |
| 🚧 (4) | `question:progress` | host | `{ answeredCount, playerCount }` |
| 🚧 (4) | `question:end` | iedereen | `{ correctOptionId, answerCounts: { [optionId]: n } }` |
| 🚧 (4) | `player:result` | één speler | `{ correct, pointsGained, totalScore, rank }` |
| 🚧 (5) | `leaderboard:show` | iedereen | `{ top: [{ nickname, score, rankChange }] }` |
| 🚧 (5) | `game:podium` | iedereen | `{ top3: [...], ranking: [{ rank, nickname, score, isVerified }] }` |
| 🚧 (6) | `game:restarted` | iedereen | `{}` → terug naar lobby, scores 0 |
| ✅ | `game:closed` | iedereen | `{ reason }` → speler terug naar `/join` |
| – | `error` | één client | `{ error, message }` |

## 5. Rooms

Helpers staan in `server/src/socket/broadcast.js` (`rooms.game`, `rooms.host`, `rooms.player`).

| Room | Wie | Gebruik |
|---|---|---|
| `482913` | host + alle spelers | events voor iedereen |
| `482913:host` | alleen de host | `question:progress` |
| `482913:player:<playerId>` | alle tabs van één speler | `player:result`, speler eruit gooien |

## 6. Game-fases

```
LOBBY ──host:start──▶ QUESTION_PREVIEW ──(timer)──▶ QUESTION_ACTIVE
  ▲                     (overslaan als previewSeconds = 0)        │
  │                                              timer op OF iedereen geantwoord
  │                                                               ▼
  │                                                       QUESTION_RESULT
  │                                                               │ host:next
  │                                                               ▼
  │                                                         LEADERBOARD
  │                                       host:next ┌─────────────┴─────────────┐
  │                                                 ▼                           ▼
  │                                     (volgende vraag)                  laatste vraag?
  │                                     QUESTION_PREVIEW                      PODIUM
  └──────────────────────────── host:restart ─────────────────────────────────┘
```

Constanten: `server/src/game/phases.js`.

## 7. Verbinding weg

- Speler valt weg → `connected: false` + `lobby:update` (grijs in de lijst). Hij kan altijd terugkomen via zijn cookie, ook als de lobby op slot zit.
- Host valt weg → de game blijft bestaan. Na 10 minuten zonder host-verbinding ruimt `GameManager` de game op en krijgt iedereen `game:closed`.
