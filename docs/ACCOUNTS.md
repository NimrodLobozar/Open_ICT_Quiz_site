# Accounts, inloggen en admin-portaal (sprint 2)

Hoe het account-systeem werkt, welke API-endpoints er zijn en hoe je het test.
Volgorde en keuzes: [IMPLEMENTATIEPLAN-SPRINT-2.md](IMPLEMENTATIEPLAN-SPRINT-2.md). Stories: [USER-STORIES-SPRINT-2.md](USER-STORIES-SPRINT-2.md).

## Snel starten

1. `docker compose up -d --build -V` (nieuwe packages: `bcryptjs`, `express-rate-limit`, `supertest`).
2. Bij het opstarten maakt de server (als ze er nog niet zijn) een **beheerder** en een **voorbeeldquiz** ([`backend/db/seed.js`](../backend/db/seed.js)):
   - e-mail `beheerder@quiz.local`, wachtwoord `Beheerder123` (uit `docker-compose.yml`, alleen voor development).
3. Log in op http://localhost:5173/inloggen. Als beheerder kom je in het admin-portaal (`/admin`).
4. Docent toevoegen: **Gebruikers → Docent toevoegen**. Er is nog geen echte maildienst: de uitnodigingslink staat in het venster én in `docker compose logs backend`.

## Rollen

| Rol | Hoe krijg je hem | Mag |
|---|---|---|
| `STUDENT` | zelf registreren op `/registreren` (altijd deze rol) | meedoen, eigen resultaten, profiel |
| `TEACHER` | een beheerder maakt het account aan | + quizzen maken en hosten, uitslagen van eigen quizzen |
| `ADMIN` | seed, of een andere beheerder | + alle quizzen en uitslagen, gebruikers beheren |

De rol wordt **altijd op de server** gecontroleerd met `requireRole(...)` ([`backend/auth/middleware.js`](../backend/auth/middleware.js)). Dat het menu-item "Gebruikers" voor een docent verborgen is, is alleen gemak; `RequireAuth` in de frontend is ook geen beveiliging.

Meedoen aan een quiz met een code kan nog steeds **zonder account**.

## Hoe inloggen werkt

```
browser                         server                               database
  │ POST /api/auth/login  ───────▶ bcrypt.compare(wachtwoord, hash)
  │                               nieuwe token (32 random bytes)  ──▶ Session { tokenHash = sha256(token) }
  │ ◀── Set-Cookie: quiz_auth=<token>; HttpOnly; SameSite=Lax
  │ GET /api/me/results  ────────▶ loadUser: sha256(cookie) opzoeken ─▶ Session + User
```

- **Wachtwoorden:** alleen een bcrypt-hash (cost 12) in `User.passwordHash`. De wachtwoordregels staan in [`src/utils/passwordRules.js`](../src/utils/passwordRules.js), gedeeld door de registratiepagina (vinkjes tijdens het typen) en de server.
- **Sessies in de database** (`Session`), niet als JWT. Daardoor werken uitloggen en "overal uitloggen" (story 9) meteen. In de database staat alleen de **hash** van de token: een gelekte database bevat geen bruikbare cookies.
- **"Ingelogd blijven":** cookie van 30 dagen. Zonder: cookie tot de browser sluit (en maximaal 12 uur op de server).
- **Eenmalige links** (`OneTimeToken`): "wachtwoord vergeten" (1 uur) en docent-uitnodiging (7 dagen). Ook gehasht, werken één keer, en een nieuwe link maakt de oude ongeldig. Na een reset log je overal uit.
- **Links in mails** gebruiken `APP_URL`, nooit de Host-header van de request (anders kan een aanvaller een link naar zijn eigen site laten mailen).

## Beveiliging in het kort

| Risico | Wat we doen | Waar |
|---|---|---|
| Wachtwoord raden | 10 foute pogingen per e-mailadres per 15 min (niet per IP: de klas zit achter één wifi-adres) | `backend/auth/rateLimits.js` |
| Raden welke e-mailadressen bestaan | zelfde melding en bijna zelfde tijd bij fout wachtwoord of onbekend adres; "wachtwoord vergeten" zegt altijd hetzelfde | `routes/auth.js` |
| Cookie stelen met JavaScript (XSS) | `HttpOnly`; React escapet alle tekst | `utils/cookies.js` |
| Andere site doet een actie namens jou (CSRF) | `SameSite=Lax` + schrijfacties met body moeten JSON zijn | `jsonBodyOnly` in `auth/middleware.js` |
| Andermans gegevens opvragen | `/api/me/...` heeft geen id in de URL; quizzen en uitslagen filteren op eigenaar (anders 404) | `routes/me.js`, `db/quizzes.js`, `db/results.js` |
| Jezelf beheerder maken | registreren negeert `role`; `PATCH /api/me` leest alleen naam/e-mail/vaardigheden | `routes/auth.js`, `routes/me.js` |
| Terugknop na uitloggen | API-antwoorden met persoonsgegevens: `Cache-Control: no-store`; de pagina's vragen bij elk bezoek opnieuw | `noStore` |
| Interne fouten lekken | alles behalve `ApiError`/`GameError` wordt `500 SERVER_ERROR` zonder details | `backend/app.js` |
| Wachtwoord-hash in een antwoord | antwoorden gaan altijd via `publicUser()` | `db/users.js` |
| Account verwijderen (AVG) | profiel weg; oude uitslagen blijven voor de ranglijst maar anoniem (`Verwijderde speler`) | `deleteUser` in `db/users.js` |

**Online zetten (productie):** zet `NODE_ENV=production` (dan zijn cookies `Secure`, dus alleen over HTTPS), een eigen `APP_URL`, en een sterk `SEED_ADMIN_PASSWORD`. Draai achter HTTPS.

## API

Alle fouten: `{ error: 'CODE', message: 'Nederlandse uitleg' }`. 401 = niet ingelogd, 403 = verkeerde rol, 404 = bestaat niet of is niet van jou.

### `/api/auth`

| Methode + pad | Body | Antwoord |
|---|---|---|
| `POST /register` | `{ username, email, password, acceptPrivacy: true }` | `201 { user }` + cookie. Fouten: `USERNAME_INVALID`, `USERNAME_TAKEN`, `EMAIL_INVALID`, `EMAIL_TAKEN`, `PASSWORD_WEAK`, `PRIVACY_REQUIRED` |
| `POST /login` | `{ email, password, remember }` | `{ user }` + cookie. Fout: `401 INVALID_LOGIN`, `429 TOO_MANY_REQUESTS` |
| `POST /logout` | – | `{ ok: true }`, cookie gewist, sessie weg |
| `GET /me` | – | `{ user }` of `{ user: null }` |
| `POST /forgot` | `{ email }` | altijd `{ ok: true }` |
| `GET /password-link?token=` | – | `{ purpose: 'RESET' \| 'INVITE', username }` of `400 LINK_INVALID` |
| `POST /password` | `{ token, password }` | `{ ok: true }` of `400 LINK_INVALID` / `PASSWORD_WEAK` |

### `/api/me` (ingelogd)

| Methode + pad | Body | Antwoord |
|---|---|---|
| `GET /results[?all=1]` | – | `{ summary: { played, bestRank, podiumCount, correctPercent }, total, results: [...] }` |
| `PATCH /` | `{ username?, email?, skills? }` | `{ user }` |
| `POST /password` | `{ currentPassword, newPassword }` | `{ ok: true }`; andere apparaten uitgelogd. `400 WRONG_PASSWORD` |
| `DELETE /` | `{ password }` | `{ ok: true }`, cookie gewist |
| `GET /sessions` | – | `{ sessions: [{ id, deviceLabel, lastSeenAt, current }] }` |
| `POST /sessions/revoke-others` | – | `{ ok: true, revoked }` |
| `GET /quiz-defaults`, `PUT /quiz-defaults` | `{ timePerQuestion, showCorrectAnswer, showStandings, lockLobbyOnStart }` | `{ defaults }` (docent/beheerder) |

### `/api/quizzes` (docent/beheerder)

`GET /?q=`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. Body voor POST/PUT:

```js
{ title, status: 'DRAFT' | 'READY', showCorrectAnswer?, showStandings?, lockLobbyOnStart?, timePerQuestion?,
  questions: [{ text, timeLimitSec?, options: [{ text, isCorrect }] }] } // 2–4 antwoorden, precies één goed
```

Ontbrekende instellingen komen uit de standaard van de docent (story 8). Hosten: `POST /api/games { quizId }` (zie [SOCKET-EVENTS.md](SOCKET-EVENTS.md)).

### `/api/admin`

| Methode + pad | Wie | Wat |
|---|---|---|
| `GET /stats` | docent, beheerder | cijfertegels van het overzicht |
| `GET /results?q=&page=` | docent, beheerder | gespeelde rondes (docent: alleen eigen quizzen) |
| `GET /results/:id` | docent, beheerder | eindstand van één ronde |
| `GET /users?role=&q=&page=` | beheerder | gebruikerslijst, 20 per pagina |
| `POST /users` | beheerder | `{ username, email }` → docent + `inviteLink` |
| `PATCH /users/:id` | beheerder | `{ username?, email? }` |
| `PATCH /users/:id/role` | beheerder | `{ role }`; eigen beheerdersrol weghalen = `409 OWN_ADMIN_ROLE` |
| `DELETE /users/:id` | beheerder | jezelf = `409 DELETE_SELF` |

## Pagina's

| Route | Wie | Bestand |
|---|---|---|
| `/inloggen`, `/registreren` | iedereen | `src/pages/Auth/AuthPage.jsx` |
| `/wachtwoord-vergeten`, `/wachtwoord-instellen?token=` | iedereen | `src/pages/Auth/` |
| `/privacy` | iedereen | `src/pages/Auth/PrivacyPage.jsx` |
| `/account`, `/account/instellingen` | ingelogd | `src/pages/Account/` |
| `/admin`, `/admin/quizzen`, `/admin/quizzen/nieuw`, `/admin/quizzen/:id`, `/admin/uitslagen`, `/admin/account` | docent, beheerder | `src/pages/Admin/` |
| `/admin/gebruikers` | beheerder | `src/pages/Admin/UsersPage.jsx` |
| `/host/new?quiz=<id>` | docent, beheerder | `src/pages/HostGamePage/HostGamePage.jsx` |

Wie er is ingelogd: `useAuth()` uit [`src/auth/AuthContext.jsx`](../src/auth/AuthContext.jsx). Beveiligde routes: `<RequireAuth roles={[...]}>` in `src/App.jsx`. Gedeelde bouwstenen (velden, knoppen, tegels): [`src/components/AccountUi.jsx`](../src/components/AccountUi.jsx).

## Testen

| Commando | Wat | Nodig |
|---|---|---|
| `npm test` | snelle tests zonder database, o.a. van alle 12 USER IMPLEMENTATION-opdrachten | niets |
| `npm run test:api` | alle API-endpoints tegen een **aparte** database `quiz_test` (wordt vanzelf aangemaakt; je eigen data blijft staan) | Docker (database op `localhost:5433`) |
| `npm run test:smoke` | de hele flow tegen de draaiende site, via de Vite-proxy en Socket.IO, zoals een browser | `docker compose up` |
| `SMOKE_URL=http://<ip>:5173 npm run test:smoke` | hetzelfde via het netwerkadres (zoals telefoons in de klas) of een online omgeving | idem |

Werkt `npm run test:api` niet meer na een grote schemawijziging? Wis de testdatabase: `docker compose exec db dropdb -U quiz quiz_test`.
