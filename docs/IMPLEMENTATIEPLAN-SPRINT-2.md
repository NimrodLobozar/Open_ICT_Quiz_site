# Implementatieplan sprint 2: accounts, inloggen en admin-portaal

Hoort bij [USER-STORIES-SPRINT-2.md](USER-STORIES-SPRINT-2.md). Designs: `.claude/designs/accounts/` (online canvas: https://claude.ai/artifact/BqhGC5qi1hAxFUk9SdMQC5).

Dit plan zegt **in welke volgorde** we de 12 stories bouwen, **waarom**, en welke technische keuzes we vooraf maken zodat we later niets hoeven om te bouwen.

---

## 1. Volgorde (belangrijkste eerst)

De volgorde volgt twee regels: eerst wat al het andere nodig heeft (fundament), daarna de Must-stories, dan Should, Could en Good to have. Waar een latere story bijna gratis is omdat het fundament er al ligt, staat dat erbij.

| Stap | Story | Prio | Waarom op deze plek |
|---|---|---|---|
| 1 | **S1 Account aanmaken + S2 Inloggen/uitloggen** | Must | Fundament: `User`-tabel, sessies, `requireAuth`/`requireRole`. Alles hierna heeft dit nodig. Samen bouwen, want registreren logt direct in. |
| 2 | **S11 Docentaccount aanmaken** (+ eerste beheerder via seed) | Must | Zonder docenten kan niemand quizzen beheren (S7). Hier bouwen we ook de **eenmalige link** (uitnodiging), die S3 later hergebruikt. |
| 3 | **S10 Gebruikers bekijken en zoeken** | Should | Klein, en S11 heeft de lijst nodig om de nieuwe docent/rol "direct in de lijst" te tonen. Daarom vóór de rest van de Should-stories. |
| 4 | **S7 Quizzen beheren en hosten** | Must | Grootste story: `Quiz`/`Question`/`AnswerOption` in de database, vragen niet meer uit `quizQuestions.js`, hosten met `quizId`, admin-overzicht. |
| 5 | **S4 Eigen resultaten terugkijken** | Must | Heeft accounts nodig én dat ingelogde spelers met hun account meedoen (`userId` op `GameResult`). Pas zinvol als er echte rondes gespeeld worden. |
| 6 | **S3 Wachtwoord vergeten** | Should | Bijna gratis: hergebruikt de eenmalige link uit stap 2. |
| 7 | **S5 Profiel en vaardigheden aanpassen** | Should | Instellingenpagina; ook nodig voor S6 (het verwijderblok staat op dezelfde pagina). |
| 8 | **S6 Account verwijderen** | Should | Verwijderlogica (`userId` op leeg zetten) die S12 hergebruikt. |
| 9 | **S12 Gebruiker aanpassen of verwijderen (beheerder)** | Could | Hergebruikt de verwijderlogica van S6 en de tabel van S10. |
| 10 | **S8 Standaardinstellingen voor quizzen** | Could | Pas zinvol als quizzen in de database staan (S7). |
| 11 | **S9 Ingelogde apparaten beheren** | Good to have | Bijna gratis, omdat we in stap 1 al een `Session`-tabel maken (zie keuze B). |

**Minimaal werkende sprint (alle Musts):** stap 1 t/m 5. Komt de sprint in tijdnood, dan vallen stap 9 t/m 11 eraf zonder dat de rest stukgaat.

---

## 2. Technische keuzes (vooraf vastgelegd)

**A. Wachtwoorden: `bcryptjs`** (cost 12). De pure-JavaScript-versie, zodat de Alpine-Docker-image niets hoeft te compileren. Wachtwoord-hash komt nooit in een API-antwoord.

**B. Sessies in de database, niet als JWT.** Tabel `Session` met een **gehashte** token (sha256), `userId`, `expiresAt`, `lastSeenAt`, `deviceLabel`. De browser krijgt de ruwe token in de httpOnly-cookie `quiz_auth` (zelfde `cookies.js`-helper als de game-cookies, projectplan 6.1).
Waarom: uitloggen en "overal uitloggen" (S9) werken dan écht (een JWT blijft geldig tot hij verloopt), en een gelekte database bevat geen bruikbare tokens.
"Ingelogd blijven" = cookie 30 dagen; anders 12 uur.

**C. Rollen:** Prisma-enum `Role { STUDENT TEACHER ADMIN }`. Registreren geeft **altijd** `STUDENT`; de server negeert een meegestuurde rol. Alle rolcontroles gebeuren op de server met `requireRole(...)`.

**D. Eenmalige links (`OneTimeToken`)** voor zowel "wachtwoord vergeten" (S3) als "docent-uitnodiging" (S11): gehashte token, `purpose` (`RESET` / `INVITE`), `expiresAt` (reset 1 uur, uitnodiging 7 dagen), `usedAt`. Eén mechanisme, twee doelen.

**E. E-mail:** `backend/mail/sendMail.js`. In development wordt de mail (met link) in `docker compose logs backend` gezet. Een echte SMTP-dienst (nodemailer) kan later zonder dat de rest verandert.

**F. Beveiliging:**
- `express-rate-limit` op `login`, `register` en `forgot` (tegen wachtwoord-raden en mail-spam).
- CSRF: cookies zijn `sameSite: 'lax'` en de API accepteert schrijfacties alleen als JSON; daarnaast een kleine `Origin`-check op `POST/PATCH/DELETE`.
- Zelfde foutmelding bij fout e-mailadres óf fout wachtwoord, en bij "wachtwoord vergeten" altijd hetzelfde antwoord (geen user-enumeration).
- Invoercontrole op de server in `backend/auth/validate.js`; de wachtwoordregels staan in `src/utils/passwordRules.js`, gedeeld met de frontend (zelfde regels bij het typen als op de server).

**G. Ingelogd meedoen aan een quiz (S4):** bij `POST /api/games/:code/players` kijkt de server of er een geldige `quiz_auth` is. Zo ja: de accountnaam wordt de spelersnaam, `isVerified: true`, en de `userId` komt mee in `toSessionRecord()` → `GameResult.userId`. Meedoen zonder account blijft werken (S2).

**H. Quizzen (S7):** `Quiz` (eigenaar, titel, `status: DRAFT | READY`, instellingen), `Question`, `AnswerOption`, volgens projectplan 12. Seed-script `prisma/seed.js` zet de huidige vragen uit `quizQuestions.js` in de database, plus een eerste beheerder uit `.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). `GameSession` krijgt een optionele `quizId`.

**I. Nieuwe dependencies:** `bcryptjs`, `express-rate-limit`; dev: `supertest`. Na het binnenhalen: `docker compose up -d --build -V`.

---

## 3. Per stap: wat er gebouwd wordt

### Stap 1 — S1 + S2: accounts en inloggen
- **Database:** `User` (id, username uniek, email uniek, passwordHash, role, skills Json, createdAt, lastActiveAt), `Session`.
- **Backend:** `backend/routes/auth.js` met `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. `backend/auth/` met `password.js`, `sessions.js`, `middleware.js` (`loadUser`, `requireAuth`, `requireRole`), `validate.js`.
- **Frontend:** `src/auth/AuthContext.jsx` (wie is ingelogd, `login`, `logout`), pagina's `/inloggen` en `/registreren` (één pagina met wisselknop, zoals het design; telefoon-layout via CSS), wachtwoord-checklist tijdens het typen, privacy-checkbox. `QuizHeader` toont "Profiel" + "Uitloggen" als je bent ingelogd. De oude routes `/login` en `/account/nieuw` sturen door.
- **Terugknop na uitloggen:** beveiligde pagina's halen hun data altijd opnieuw op en API-antwoorden met persoonlijke data krijgen `Cache-Control: no-store`.

### Stap 2 — S11: docent aanmaken
- **Backend:** `POST /api/admin/users` (maakt `TEACHER` + uitnodigingslink), `PATCH /api/admin/users/:id/role`, `POST /api/auth/set-password` (link gebruiken). Beheerder kan zijn eigen `ADMIN`-rol niet weghalen.
- **Frontend:** admin-layout `src/pages/Admin/AdminLayout.jsx` (zijmenu uit het design: Overzicht, Quizzen, Gebruikers, Uitslagen, Mijn account), formulier "Docent toevoegen", pagina `/wachtwoord-instellen?token=...`.

### Stap 3 — S10: gebruikerslijst
- **Backend:** `GET /api/admin/users?role=&q=&page=` (20 per pagina), alleen `ADMIN`.
- **Frontend:** `/admin/gebruikers`: tabel, rolfilters, zoekveld (met kleine vertraging tijdens het typen), Vorige/Volgende, horizontaal scrollen op een klein scherm, rol wijzigen per rij.

### Stap 4 — S7: quizzen in de database en hosten
- **Database:** `Quiz`, `Question`, `AnswerOption`; seed met de huidige vragen.
- **Backend:** `backend/db/quizzes.js`; `GET /api/quizzes?q=` (eigen quizzen; beheerder ziet alles), `GET/POST/PATCH /api/quizzes/:id`. `POST /api/games` krijgt `{ quizId }`, vereist `TEACHER`/`ADMIN`, weigert `DRAFT` en laadt de vragen uit de database in `new Game(code, { questions })`.
- **Frontend:** `/admin` (Overzicht): cijfertegels, quizlijst met statuslabel, zoeken, "Hosten" en "Bewerken". "Hosten" → `/host/:code`.
- **Open punt (zie §6):** de designs hebben geen quiz-editor. Voorstel: eenvoudige editor (titel, status, vragen met 4 antwoorden) in een eigen pagina `/admin/quizzen/:id`.

### Stap 5 — S4: mijn resultaten
- **Database:** `GameResult.userId` (optioneel, `onDelete: SetNull`).
- **Backend:** ingelogd joinen (keuze G); `GET /api/me/results` (samenvatting + laatste 20 rondes). Een gebruiker kan alleen zijn eigen resultaten opvragen (geen id in de URL).
- **Frontend:** `/account`: profielkaart, cijfertegels, vaardigheden, "Laatst gespeeld", lege staat; telefoon-layout. Vaardigheden (SD, AI, TI, CSC, GD, BI) ook bij registreren (zie §6).

### Stap 6 — S3: wachtwoord vergeten
- **Backend:** `POST /api/auth/forgot` (altijd `200` met dezelfde tekst), `POST /api/auth/reset`. Na een reset worden alle sessies van die gebruiker ingetrokken.
- **Frontend:** `/wachtwoord-vergeten` en `/wachtwoord-instellen?token=...` (zelfde pagina als bij de uitnodiging).

### Stap 7 — S5: instellingen
- **Backend:** `PATCH /api/me` (naam, e-mail, vaardigheden), `POST /api/me/password` (huidig wachtwoord verplicht; trekt de andere sessies in).
- **Frontend:** `/account/instellingen` met de secties Profiel, Vaardigheden, Wachtwoord en een bevestiging "Je wijzigingen zijn opgeslagen."

### Stap 8 — S6: account verwijderen
- **Backend:** `deleteUser(id)` in `backend/db/users.js` (één transactie: `GameResult.userId` → `null`, sessies en tokens weg, gebruiker weg). `DELETE /api/me` vraagt het wachtwoord ter bevestiging en logt uit.
- **Frontend:** verwijderblok met bevestigingsvenster.

### Stap 9 — S12: beheerder past gebruiker aan of verwijdert
- **Backend:** `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id` (zelfde `deleteUser`; beheerder kan zichzelf hier niet verwijderen).
- **Frontend:** bewerkvenster en bevestigingsvenster in de tabel, melding na elke actie.

### Stap 10 — S8: standaardinstellingen
- **Database:** `User.quizDefaults` (Json: `timePerQuestion`, `showCorrectAnswer`, `showStandings`, `lockLobbyOnStart`) en dezelfde velden als kolommen op `Quiz` (kopie bij het aanmaken, zodat bestaande quizzen niet veranderen).
- **Frontend:** blok "Standaard voor nieuwe quizzen" op `/admin/account`.

### Stap 11 — S9: apparaten
- **Backend:** `GET /api/me/sessions` (apparaattype en "laatst actief", geen IP-adres), `POST /api/me/sessions/revoke-others`.
- **Frontend:** lijst "Ingelogd op" met "Dit apparaat" en de knop "Overal uitloggen".

---

## 4. Zelf implementeren (leeropdrachten)

Per story laat Claude **één stukje** open dat jij zelf schrijft. In de code staat op die plek een comment:

```js
// USER IMPLEMENTATION (S1): ...uitleg wat hier moet...
```

Tot jij het invult, staat er een veilige tijdelijke versie (bijv. `throw new Error('USER IMPLEMENTATION S1')`), en de bijbehorende test faalt. Zo zie je met `npm test` direct of het klopt. Voorlopige keuze van de opdrachten:

| Story | Wat je zelf schrijft | Bestand (voorlopig) |
|---|---|---|
| S1 | De wachtwoordregels "een cijfer" en "een hoofdletter" | `src/utils/passwordRules.js` |
| S2 | `requireRole(...roles)`: weigeren met 403 als de rol niet past | `backend/auth/middleware.js` |
| S3 | Controle of een eenmalige link nog geldig is (niet gebruikt, niet verlopen) | `backend/auth/tokenRules.js` |
| S4 | De samenvatting: beste plaats en aantal podiumplaatsen | `backend/results/summary.js` |
| S5 | Het huidige wachtwoord controleren vóór het wijzigen | `backend/routes/me.js` |
| S6 | Het bevestigingswoord `VERWIJDER` controleren | `src/utils/confirmDelete.js` |
| S7 | Weigeren om een concept-quiz te hosten | `backend/quiz/quizRules.js` |
| S8 | Instellingen van de quiz samenvoegen met de standaard van de docent | `backend/quiz/quizRules.js` |
| S9 | Een leesbaar apparaatlabel maken uit de `User-Agent` | `backend/auth/deviceLabel.js` |
| S10 | Het Prisma-`where` voor zoeken op naam of e-mail | `backend/db/userFilters.js` |
| S11 | De controle "beheerder haalt eigen beheerdersrol niet weg" | `backend/auth/roleRules.js` |
| S12 | De controle "beheerder verwijdert zichzelf niet via de beheertabel" | `backend/auth/roleRules.js` |

Bijna alle opdrachten zijn losse functies zonder database geworden, zodat `npm test` (zonder Docker) ze kan controleren. S5 controleer je met `npm run test:api`.

De stap-voor-stap-handleiding staat in **[SPRINT-2-ZELF-IMPLEMENTEREN.md](SPRINT-2-ZELF-IMPLEMENTEREN.md)**: per opdracht het bestand, de regels, wat er moet komen te staan, waarom, hoe je test, en een oplossing om open te klappen. Onderaan staat de zin die je aan Claude geeft om je werk te laten controleren.

---

## 5. Testen en controleren

1. **Unit-tests (vitest)** voor pure functies: wachtwoordregels, validatie, tokens, ranking-samenvatting, apparaatlabel, rolcontroles.
2. **API-tests (vitest + supertest)** voor elke endpoint, tegen een aparte testdatabase `quiz_test` in dezelfde Postgres-container (zodat je eigen data niet wordt gewist). Elke story krijgt tests voor: de goede route, foute invoer, niet ingelogd (401), verkeerde rol (403), en andermans data (niet zichtbaar).
3. **Code- en beveiligingsreview, regel voor regel**: wachtwoorden en tokens gehasht, geen hash in antwoorden, rolcontroles op de server, rate limits, cookies (`httpOnly`, `sameSite`, `secure` in productie), user-enumeration, invoercontrole, SQL-injectie (Prisma), XSS (React escapet; geen `dangerouslySetInnerHTML`), foutmeldingen zonder interne details.
4. **Rooktest op localhost (Docker)**: een script dat de echte flow doorloopt via http://localhost:5173 (via de Vite-proxy, dus net als de browser): registreren → inloggen → quiz hosten → twee spelers (één ingelogd) → podium → resultaat terugzien → uitloggen → terugknop.
5. **Productie-check**: `npm run build` moet slagen, en met `NODE_ENV=production` moeten cookies `secure` zijn. Er is nog geen online omgeving; zodra die er is (URL), draait dezelfde rooktest daartegen.

---

## 6. Beslissingen (genomen op 26 oktober 2026)

1. **Quiz-editor:** gebouwd (`/admin/quizzen/nieuw` en `/admin/quizzen/:id`), in de stijl van het admin-portaal. Er is geen apart design voor.
2. **Vaardigheden bij registreren:** **niet** op het registratiescherm (zoals het design). Je vult ze in bij Instellingen, en bij het joinen beginnen de sliders bij je opgeslagen waarden.
3. **"Quizzen" en "Uitslagen":** "Quizzen" is de volledige quizlijst (met verwijderen). Voor **"Uitslagen"** is het design uitgebreid (scherm "10 · Admin — uitslagen" op het canvas en in `.claude/designs/accounts/`) en de pagina is gebouwd.
4. **Gebruikersnaam:** uniek, hoofdletterongevoelig (`User.usernameKey`).

## 7. Wat er gebouwd is

Alle 12 stories, op de 12 USER IMPLEMENTATION-opdrachten na. Uitleg en API: [ACCOUNTS.md](ACCOUNTS.md). Getest met 95 unit-tests, 83 API-tests en een rooktest via de Vite-proxy en Socket.IO (`npm run test:smoke`), plus een beveiligingsreview.

Bewust nog niet gedaan (voor een volgende sprint):
- Een echte maildienst (nu staan mails met links in `docker compose logs backend`; in productie worden ze niet gelogd).
- Een gast kan een naam kiezen die gelijk is aan een accountnaam (bijv. "Emma") voordat Emma met haar account meedoet. Emma krijgt dan "naam bezet". Spelers met een account hebben wel het account-icoontje (`isVerified`).
- "Lobby dicht bij de start": de lobby is na de start altijd al dicht. Deze instelling zorgt dat hij na **opnieuw spelen** dicht blijft tot de host hem openzet.
