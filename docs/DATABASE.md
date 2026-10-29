# Database

> Stand van zaken op 26 oktober 2026 (sprint 2, branch `feature_account_design`). Accounts, sessies en quizzen: zie ook [ACCOUNTS.md](ACCOUNTS.md).

## In het kort

- **PostgreSQL 16** in Docker (service `db`), gebruiker/wachtwoord/database: `quiz` / `quiz` / `quiz`.
  Vanaf je laptop op poort **`5433`**, binnen Docker op `db:5432`.
- **Bekijken in de browser:** Adminer op http://localhost:8080 (systeem PostgreSQL, server `db`, gebruiker/wachtwoord/database `quiz`).
- **Prisma 7** met de `@prisma/adapter-pg`-adapter. De client staat in [`backend/db/prisma.js`](../backend/db/prisma.js); importeer altijd díé `prisma`, maak geen tweede `PrismaClient` aan.
- Het schema staat in [`prisma/schema.prisma`](../prisma/schema.prisma). Er zijn **nog geen migraties**: nodemon draait `npx prisma db push` bij het opstarten en bij elke schemawijziging.

## Wat staat waar?

| | Waar | Waarom |
|---|---|---|
| Lopende game (lobby, spelers, scores tijdens het spel) | geheugen van de server ([`backend/game/`](../backend/game/)) | snel: een antwoord kost geen databasequery (projectplan 6) |
| Uitslag van een gespeelde ronde | database (`GameSession` + `GameResult`) | blijft bewaard, ook als de server herstart |
| Accounts, ingelogde apparaten, eenmalige links | database (`User`, `Session`, `OneTimeToken`) | inloggen moet een herstart overleven |
| Quizzen met vragen en antwoorden | database (`Quiz`, `Question`, `AnswerOption`) | docenten maken ze zelf in het admin-portaal; bij het hosten kopieert de server ze naar de `Game` |

De server schrijft **één keer per ronde**, op het moment van het podium:

1. `game.finish()` zet de eindstand vast met `getRanking()`.
2. `sendPodium()` stuurt de eindstand naar iedereen.
3. `saveGameResultsInBackground(game)` ([`backend/db/gameResults.js`](../backend/db/gameResults.js)) slaat hem op.

Stap 3 komt ná het podium en wacht niemand op: ligt de database eruit, dan zien spelers gewoon hun eindstand en staat de fout in `docker compose logs backend`.

Dit gebeurt in `afterPhaseChange` bij `PODIUM` ([`backend/socket/gameLoop.js`](../backend/socket/gameLoop.js)) en in `dev:finish`.

## Tabellen

### `GameSession`: één gespeelde ronde

| Kolom | Type | Uitleg |
|---|---|---|
| `id` | `integer` | primary key |
| `code` | `text` | de lobbycode. **Niet uniek**: herstart geeft een nieuwe rij met dezelfde code, en codes worden later opnieuw uitgedeeld |
| `round` | `integer` | 1, en +1 bij elke `host:restart` |
| `startedAt` | `timestamp` | moment dat de lobby (opnieuw) openging |
| `endedAt` | `timestamp` | moment van het podium |
| `quizId` | `integer?` | foreign key → `Quiz.id` (`SET NULL`: quiz weg = uitslag blijft) |
| `quizTitle` | `text?` | kopie van de titel, zodat de uitslag leesbaar blijft als de quiz verwijderd is |
| `questionCount` | `integer` | aantal vragen, voor "% goed" op Mijn account |

### `GameResult`: eindstand van één speler in één ronde

| Kolom | Type | Uitleg |
|---|---|---|
| `id` | `integer` | primary key |
| `sessionId` | `integer` | foreign key → `GameSession.id` (`ON DELETE CASCADE`: sessie weg = resultaten weg) |
| `nickname` | `text` | wordt `Verwijderde speler` als het account verwijderd is |
| `userId` | `integer?` | foreign key → `User.id`; `null` = gast. Ingelogd meedoen vult dit (story 4) |
| `score` | `integer` | totaal aantal punten |
| `rank` | `integer` | plek uit `getRanking()` (gelijke score = gedeelde plek) |
| `correctCount` | `integer` | aantal goede antwoorden |
| `skills` | `jsonb` | de ervaring-sliders van de joinpagina, bijv. `{"Frontend": 4}`. De server houdt alleen getallen 0 t/m 5 over |
| `isBot` | `boolean` | testspelers van `dev:finish`; filter ze weg met `WHERE NOT "isBot"` |

**Waarom staat `rank` er wél in?** Het is een momentopname van wat de spelers op het podium zagen. Rekenen doe je in de app altijd met `getRanking()` uit [`src/utils/ranking.js`](../src/utils/ranking.js), niet zelf in SQL.

De vertaling van een `Game` naar deze rijen staat in `Game.toSessionRecord()`, zonder Prisma, zodat je hem kunt testen zonder database ([`backend/tests/gameResults.test.js`](../backend/tests/gameResults.test.js)).

## Verschil met het projectplan

Dit volgt hoofdstuk 12 van het projectplan, maar nog niet alles:

| Projectplan | Nu |
|---|---|
| `GameSession`, `GameResult` | ✅ gebouwd, met `quizId` en `userId` (`quizId` optioneel, voor oude rondes) |
| `Quiz` (= de vragenset), `Question`, `AnswerOption` | ✅ gebouwd (sprint 2). `Quiz` heeft `status` (DRAFT/READY) en instellingen i.p.v. `isPublished` |
| `User` | ✅ gebouwd, met `role` als enum (STUDENT/TEACHER/ADMIN) i.p.v. `Role` + `UserRole`; vaardigheden als `skills` (jsonb) |
| (niet in plan) | `Session`, `OneTimeToken` (zie ACCOUNTS.md), `GameResult.skills`, `GameResult.isBot` |
| `PlayerAnswer` (later) | ontbreekt |

De oude tabellen `Quiz` (eigenlijk een lobby) en `Player` en de route `/api/code` zijn weg: de app gebruikte ze niet, de lobby draait helemaal op het geheugen.

## Queries

### Prisma (in de backend)

```js
import { prisma } from '../db/prisma.js'

// De laatste ronde van een lobby, met de uitslag op volgorde.
const session = await prisma.gameSession.findFirst({
  where: { code: '482913' },
  orderBy: { round: 'desc' },
  include: { results: { orderBy: [{ rank: 'asc' }, { nickname: 'asc' }] } },
})
```

### SQL (in Adminer → "SQL-opdracht", of met `docker compose exec db psql -U quiz -d quiz`)

Tabel- en kolomnamen met hoofdletters moeten tussen dubbele quotes (`"GameResult"`, `"isBot"`), anders zoekt Postgres naar kleine letters.

```sql
-- Alle gespeelde rondes, nieuwste eerst
SELECT id, code, round, "startedAt", "endedAt" FROM "GameSession" ORDER BY id DESC;

-- Uitslag van één lobby, zonder bots
SELECT s.round, r.rank, r.nickname, r.score, r."correctCount", r.skills
FROM "GameResult" r
JOIN "GameSession" s ON s.id = r."sessionId"
WHERE s.code = '482913' AND NOT r."isBot"
ORDER BY s.round, r.rank, r.nickname;

-- Testdata opruimen (resultaten gaan mee door de cascade)
DELETE FROM "GameSession";
```

## Handige commando's

| Wat | Commando |
|---|---|
| Database bekijken | http://localhost:8080 (Adminer), of `npx prisma studio` met `DATABASE_URL=postgresql://quiz:quiz@localhost:5433/quiz` |
| Schema naar de database zetten | gaat vanzelf (nodemon), of `npx prisma db push` |
| Alles leeg en opnieuw | `docker compose down -v` en daarna `docker compose up --build` |
