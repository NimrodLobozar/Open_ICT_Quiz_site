# Socket.IO event-contract

Wat er **nu** gebouwd is. Het volledige plan staat in hoofdstuk 8 van het [projectplan](../Quizapp-Projectplan-Codebase.md).

> **Afspraak:** de eventnamen staan in [`backend/socket/events.js`](../backend/socket/events.js) én in de kopie [`src/socket/events.js`](../src/socket/events.js). Verander je er één, pas dan ook de andere en dit bestand aan, in dezelfde PR.

Uitleg over hoe het werkt: [SOCKET-IO-UITLEG.md](SOCKET-IO-UITLEG.md).

## REST: sessies (zetten en wissen cookies)

| Methode + pad | Body | Antwoord | Cookie |
|---|---|---|---|
| `POST /api/games` | – | `201 { gameCode }` | zet `quiz_host` |
| `GET /api/games/:code` | – | `{ exists, locked, phase }` | – |
| `POST /api/games/:code/players` | `{ nickname }` | `201 { playerId, nickname }` | zet `quiz_player` |
| `GET /api/games/:code/me` | – | `{ role: 'player', playerId, nickname }` | leest `quiz_player` |
| `GET /api/games/:code/me?role=host` | – | `{ role: 'host' }` | leest `quiz_host` |
| `DELETE /api/games/:code/players/me` | – | `{ ok: true }` | wist `quiz_player` |

Fouten: `{ error, message }` met status `404 GAME_NOT_FOUND`, `409 NAME_TAKEN`, `400 NAME_INVALID`, `403 LOBBY_LOCKED`, `403 WRONG_PHASE`, `401 NO_SESSION`.

`DELETE …/players/me` verwijdert de speler (naam komt vrij), verbreekt zijn open sockets en stuurt `lobby:update`. De eindstand blijft gelijk: die is bij het podium vastgezet.

## Verbinden

```js
socket.auth = { code: '482913', role: 'player' } // of 'host'
socket.connect()
```

De `sessionMiddleware` leest de bijbehorende cookie uit de handshake. Klopt die niet bij `code` en `role`, dan krijgt de client `connect_error` met `error.message === 'NO_SESSION'`.

Rooms: `482913` (iedereen), `482913:host` (host), `482913:player:<id>` (één speler, alle tabbladen).

## Client → server

Elke actie heeft een ack: `{ ok: true, ... }` of `{ ok: false, error, message }`.

| Event | Van | Payload | Ack |
|---|---|---|---|
| `game:sync` | host/speler | `{}` | `{ ok, state }`, zie hieronder |
| `host:start` | host | `{}` | `{ ok }`; alleen in `LOBBY`. Minimaal 2 spelers, anders `NOT_ENOUGH_PLAYERS`. Daarna kan niemand meer joinen |
| `host:next` | host | `{ phase, questionIndex }` (het scherm waarop de host klikte) | `{ ok }`; één stap verder, zie [Fases](#fases). Hoort de klik bij een scherm dat al voorbij is (dubbelklik, timer was eerder), dan `WRONG_PHASE` |
| `player:answer` | speler | `{ questionIndex, optionId }` | `{ ok }` (zegt **niet** of het goed is). Fouten: `WRONG_PHASE`, `ALREADY_ANSWERED`, `TOO_LATE`, `INVALID_OPTION` |
| `host:restart` | host | `{}` | `{ ok }`; alleen in fase `PODIUM`, anders `WRONG_PHASE`. Zelfde spelers en namen, scores 0, terug naar `LOBBY` |
| `host:kick-player` | host | `{ playerId }` | `{ ok }`; alleen in `LOBBY`, anders `WRONG_PHASE`. Speler weg (naam komt vrij), zijn open sockets worden verbroken en iedereen krijgt `lobby:update`. De speler-client gaat dan terug naar `/join/:code` |
| `dev:finish` | host, **alleen development** | `{ bots?: number }` | `{ ok }`; vanuit de lobby: speelt 8 nepvragen en gaat meteen naar `PODIUM` (om het eindscherm met veel spelers te testen) |

### Fases

```
LOBBY ─host:start─▶ QUESTION_PREVIEW ─(leestijd voorbij, of host:next)─▶ QUESTION_ACTIVE
                          ▲                                                    │
                          │                 tijd op, iedereen online heeft geantwoord, of host:next
                          │                                                    ▼
                          └──────── host:next (niet de laatste vraag) ── QUESTION_RESULT
                                                                               │ host:next (laatste vraag)
                                                                               ▼
                                                                            PODIUM
```

- De server houdt de tijd bij (`backend/socket/gameLoop.js`). Leestijd: 5 seconden, antwoordtijd: `timeLimitSec` van de vraag (20).
- `QUESTION_RESULT` toont de uitslag van de vraag én de tussenstand (één scherm, zoals in het design). `LEADERBOARD` uit het projectplan wordt (nog) niet gebruikt.
- Punten: `src/utils/scoring.js`, goed = 1000 (direct) tot 500 (op de valreep), fout of geen antwoord = 0.

### `state` van `game:sync`

```js
{
  code: '482913',
  phase: 'LOBBY' | 'QUESTION_PREVIEW' | 'QUESTION_ACTIVE' | 'QUESTION_RESULT' | 'PODIUM',
  lobby: { players: [{ id, nickname, connected, isVerified }], playerCount, locked },
  me: { playerId, nickname, score } | null,  // alleen voor spelers
  question: <zelfde als question:show> | null,          // in de vraag-fases
  progress: <zelfde als question:progress> | null,      // alleen host, in QUESTION_ACTIVE
  questionEnd: <zelfde als question:end> | null,        // in QUESTION_RESULT
  myQuestionResult: <zelfde als question:my-result> | null, // alleen speler, in QUESTION_RESULT
  myAnswer: optionId | null,                 // alleen speler: wat je bij deze vraag al koos
  podium: <zelfde als game:podium> | null,   // alleen in PODIUM
  result: <zelfde als player:result> | null, // alleen in PODIUM, alleen voor spelers
}
```

Zo krijgt een speler na verversen of verbindingsverlies precies hetzelfde scherm terug, ook midden in een vraag.

## Server → client

| Event | Naar | Payload |
|---|---|---|
| `lobby:update` | room (iedereen) | `{ players: [{ id, nickname, connected, isVerified }], playerCount, locked }` |
| `question:show` | room (iedereen) | zie hieronder. Bij een nieuwe vraag én als de leestijd voorbij is (dan met `phase: 'QUESTION_ACTIVE'`) |
| `question:progress` | host-room | `{ answeredCount, playerCount }`; na elk antwoord |
| `question:end` | room (iedereen) | `{ questionIndex, correctOptionId, answerCounts: { [optionId]: n }, ranking: [{ id, nickname, score, rank, isVerified, pointsGained }] }` |
| `question:my-result` | room van één speler | `{ questionIndex, answered, optionId, correct, pointsGained }`; direct na `question:end` |
| `game:podium` | room (iedereen) | `{ top3, ranking: [{ id, nickname, score, rank, isVerified }], totalQuestions }` |
| `player:result` | room van één speler | zie hieronder |
| `game:restarted` | room (iedereen) | `{}`; direct daarna volgt `lobby:update`. Clients gaan terug naar het lobby-wachtscherm |

### `question:show`

```js
{
  phase: 'QUESTION_PREVIEW' | 'QUESTION_ACTIVE',
  index: 2, total: 8,                 // index telt vanaf 0 → "Vraag 3 van 8"
  text: 'Welke HTTP-statuscode …?',
  options: [{ id: 1, text: '200' }, …], // NOOIT isCorrect: dat hoort de client pas bij question:end
  timeLimitSec: 20, previewSeconds: 5,
  startsAt: 1760000000000,            // servertijd (ms) waarop je mag antwoorden
  serverTime: 1759999995000,          // servertijd bij het versturen
}
```

De klok van een laptop of telefoon kan afwijken van de server. De client rekent `startsAt` daarom om naar zijn eigen klok met `serverTime` ([`src/socket/serverTime.js`](../src/socket/serverTime.js)). De tijd is op bij `startsAt + timeLimitSec * 1000`.

### `player:result` (na de laatste vraag)

```js
{
  playerId: 8, nickname: 'Emma',
  rank: 8, playerCount: 12,          // "Emma, jij bent 8e van 12 spelers"
  totalScore: 3720,                  // kaart "Punten"
  correctCount: 5, totalQuestions: 8, // kaart "Goed" → 5/8
  nextRank: 7, pointsToNext: 400,    // kaart "Tot 7e" → 400. Op plek 1: allebei null
  isGuest: true,                     // gastknop en -melding tonen
}
```

`ranking` en `rank` komen uit `getRanking()` ([`src/utils/ranking.js`](../src/utils/ranking.js)), `player:result` uit `buildPlayerResult()` ([`src/utils/playerResult.js`](../src/utils/playerResult.js)). Beide draaien op de server; de client rekent niets na.
