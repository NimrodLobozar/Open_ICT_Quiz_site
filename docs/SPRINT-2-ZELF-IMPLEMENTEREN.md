# Sprint 2: zelf implementeren (USER IMPLEMENTATION)

Bijna alles van sprint 2 is gebouwd en getest. Per user story is **één klein stukje** opengelaten, zodat jij het zelf schrijft. In de code staat op die plek:

```js
// USER IMPLEMENTATION (S1): ...uitleg...
```

Alle plekken vinden: `grep -rn "USER IMPLEMENTATION (S" backend src` (of zoek in VS Code op `USER IMPLEMENTATION`).

**Zo werkt het:**

- Er staat nu een **tijdelijke versie**. Raakt het stuk de beveiliging (S2, S3, S5, S6), dan weigert die tijdelijke versie alles: veilig, maar die functie werkt nog niet. Bij de andere doet de app het gewoon, alleen de regel ontbreekt.
- Voor elke opdracht is er een test die nu **faalt** en groen wordt als je het goed doet. Begin: `npm test` geeft **28 failed**. Klaar: **0 failed**.
- Haal het `// USER IMPLEMENTATION`-commentaar weg als je klaar bent, of vervang het door een kort commentaar in eigen woorden (Nederlands, *waarom*). Laat de regel `// Stappenplan: ...` ook weg.
- Probeer het eerst zelf. Onder elke opdracht staat een **oplossing** die je kunt openklappen.

**Aanbevolen volgorde** (S2 eerst: zonder S2 werkt het hele admin-portaal niet):

| # | Story | Opdracht | Bestand | Moeilijk |
|---|---|---|---|---|
| S2 | Inloggen | `requireRole`: verkeerde rol weigeren | `backend/auth/middleware.js` | ★☆☆ |
| S1 | Account aanmaken | twee wachtwoordregels | `src/utils/passwordRules.js` | ★★☆ |
| S7 | Quizzen hosten | concept-quiz weigeren | `backend/quiz/quizRules.js` | ★☆☆ |
| S3 | Wachtwoord vergeten | is de link nog geldig? | `backend/auth/tokenRules.js` | ★☆☆ |
| S4 | Resultaten | beste plaats en podiumplaatsen | `backend/results/summary.js` | ★★☆ |
| S11 | Docentaccount | eigen beheerdersrol niet weghalen | `backend/auth/roleRules.js` | ★☆☆ |
| S12 | Gebruiker verwijderen | jezelf niet verwijderen | `backend/auth/roleRules.js` | ★☆☆ |
| S10 | Gebruikers zoeken | zoekfilter voor Prisma | `backend/db/userFilters.js` | ★★☆ |
| S5 | Profiel/wachtwoord | huidig wachtwoord controleren | `backend/routes/me.js` | ★★☆ |
| S6 | Account verwijderen | bevestigingswoord controleren | `src/utils/confirmDelete.js` | ★☆☆ |
| S8 | Standaardinstellingen | instellingen samenvoegen | `backend/quiz/quizRules.js` | ★★☆ |
| S9 | Apparaten | apparaatlabel uit de User-Agent | `backend/auth/deviceLabel.js` | ★★★ |

**Voorbereiding (één keer):**

1. Docker draait: `docker compose up -d --build -V` (`-V` omdat er nieuwe packages zijn).
2. `npm install` op je laptop (voor de tests).
3. `npm test` → je ziet 28 rode tests. Dat klopt.
4. Inloggen als beheerder: http://localhost:5173/inloggen met `beheerder@quiz.local` / `Beheerder123`.

> Regelnummers kloppen zolang je nog niets anders in het bestand hebt veranderd. Zie je net iets anders, zoek dan op `USER IMPLEMENTATION (S..)`.

---

## S2: `requireRole` (story 2: inloggen en uitloggen)

**Bestand:** `backend/auth/middleware.js`, **regel 33–37** (in de functie `requireRole`).

**Wat staat er nu:** regel 37 gooit altijd een fout `NOT_IMPLEMENTED` (501). Daardoor kan niemand bij het admin-portaal, de quizzen of het hosten.

**Wat moet het worden:** als de rol van de ingelogde gebruiker (`request.user.role`) in de lijst `roles` staat, roep je `next()` aan (= "ga door naar de route"). Staat hij er niet in, gooi dan een `ApiError` met code `'FORBIDDEN'`, een Nederlandse melding en status `403`.

**Waarom:** dit is de échte beveiliging van het admin-portaal. Dat de frontend het menu verbergt, kan iedereen omzeilen met DevTools of Postman; de server moet het zelf controleren. 401 = "wie ben jij?" (niet ingelogd), 403 = "ik weet wie je bent, maar dit mag jij niet".

**Stappen:**
1. Verwijder regel 33–37 (het commentaar en de `throw new ApiError('NOT_IMPLEMENTED', ...)`).
2. Schrijf een `if` die kijkt of `roles` de rol bevat (tip: `Array.prototype.includes`).
3. Zo niet: `throw new ApiError(...)` met de drie waarden hierboven.
4. Daarna: `next()`.

**Testen:** `npx vitest run backend/tests/requireRole.test.js` → 4 groen. In de browser: log in als beheerder → `/admin` werkt. Log in als student en ga naar `/admin/gebruikers` → je wordt teruggestuurd, en `http://localhost:5173/api/admin/users` geeft `403`.

<details><summary>Oplossing</summary>

```js
    if (!request.user) throw new ApiError('NOT_LOGGED_IN', 'Log eerst in.', 401)
    if (!roles.includes(request.user.role)) {
      throw new ApiError('FORBIDDEN', 'Je hebt hier geen toegang toe.', 403)
    }
    next()
```
</details>

---

## S1: wachtwoordregels (story 1: account aanmaken)

**Bestand:** `src/utils/passwordRules.js`, **regel 7–10** (in de lijst `PASSWORD_RULES`, onder de regel `length`).

**Wat staat er nu:** alleen de regel "Minstens 8 tekens". Een wachtwoord als `aaaaaaaa` wordt nu dus nog geaccepteerd.

**Wat moet het worden:** voeg twee regels toe in precies dezelfde vorm als `length`:
- `id: 'digit'`, `label: 'Een cijfer'`, en een `test` die `true` geeft als er minstens één cijfer in het wachtwoord zit;
- `id: 'upper'`, `label: 'Een hoofdletter'`, en een `test` die `true` geeft als er minstens één hoofdletter in zit, **ook** É, Ö enzovoort.

**Waarom:** dit bestand wordt door de registratiepagina (de vinkjes tijdens het typen) én de server (`backend/auth/validate.js`) gebruikt. Eén plek, dus de pagina en de server zijn het altijd eens. `[A-Z]` mist letters met een accent; met de regex-vlag `u` kun je `\p{Lu}` gebruiken ("elke hoofdletter in Unicode").

**Testen:** `npx vitest run backend/tests/passwordRules.test.js` → alles groen. In de browser: `/registreren`, typ een wachtwoord en zie de drie vinkjes groen worden.

<details><summary>Oplossing</summary>

```js
  { id: 'length', label: 'Minstens 8 tekens', test: (password) => password.length >= 8 },
  { id: 'digit', label: 'Een cijfer', test: (password) => /\d/.test(password) },
  // \p{Lu} = elke hoofdletter, ook É of Ö. [A-Z] zou die missen.
  { id: 'upper', label: 'Een hoofdletter', test: (password) => /\p{Lu}/u.test(password) },
]
```
</details>

---

## S7: concept-quiz niet hosten (story 7: quizzen beheren en hosten)

**Bestand:** `backend/quiz/quizRules.js`, **regel 55–57** (bovenaan in de functie `assertCanHost`, vóór de `if` over `QUIZ_EMPTY` op regel 58).

**Wat staat er nu:** alleen de controle "heeft de quiz vragen?". Een concept kan nu dus gehost worden (in de lijst is de knop wel uit, maar via de API lukt het).

**Wat moet het worden:** is `quiz.status` niet `'READY'`, gooi dan `new ApiError('QUIZ_DRAFT', '<duidelijke melding>', 409)`. Kijk hoe de `QUIZ_EMPTY`-regel eronder het doet.

**Waarom:** 409 = "Conflict": het verzoek is op zich goed, maar de quiz staat in een toestand waarin het niet kan.

**Testen:** `npx vitest run backend/tests/quizRules.test.js` (de S7-tests). In de browser: maak een quiz met status Concept en probeer `http://localhost:5173/host/new?quiz=<id>` → je ziet de melding.

<details><summary>Oplossing</summary>

```js
export function assertCanHost(quiz) {
  if (quiz.status !== 'READY') {
    throw new ApiError('QUIZ_DRAFT', 'Deze quiz is nog een concept. Zet hem eerst op "Klaar".', 409)
  }
  if (quiz.questions.length === 0) {
```
</details>

---

## S3: is de link nog geldig? (story 3: wachtwoord vergeten)

**Bestand:** `backend/auth/tokenRules.js`, **regel 9–13** (de functie `isTokenUsable`).

**Wat staat er nu:** `return false`, dus elke link is ongeldig. "Wachtwoord vergeten" en docent-uitnodigingen werken nu niet.

**Wat moet het worden:** één regel die `true` geeft als **allebei** waar is:
- de link is nog niet gebruikt: `record.usedAt` is `null`;
- de link is nog niet verlopen: `record.expiresAt` ligt **na** `now`.

**Waarom:** een eenmalige link mag maar één keer werken (anders kan iemand die je mail later leest, je account overnemen) en moet verlopen. Datums kun je in JavaScript gewoon vergelijken met `>`. Let op: precies op het verloopmoment is hij al ongeldig.

**Testen:** `npx vitest run backend/tests/tokenRules.test.js`. In de browser: `/wachtwoord-vergeten` met `beheerder@quiz.local`, pak de link uit `docker compose logs backend`, kies een nieuw wachtwoord, en open de link nog een keer: "Deze link is verlopen of al gebruikt".

<details><summary>Oplossing</summary>

```js
export function isTokenUsable(record, now = new Date()) {
  return record.usedAt === null && record.expiresAt > now
}
```
</details>

---

## S4: beste plaats en podiumplaatsen (story 4: eigen resultaten)

**Bestand:** `backend/results/summary.js`, **regel 14–19** (in `summarizeResults`).

**Wat staat er nu:** `bestRank = null` en `podiumCount = 0`, dus op Mijn account staat altijd "–" en "0×".

**Wat moet het worden:**
- `bestRank`: de **laagste** `rank` uit `rows` (plaats 1 is het best). Zijn er geen rijen (`played === 0`), dan `null`.
- `podiumCount`: het aantal rijen met `rank` 1, 2 of 3. Een gedeelde tweede plaats telt ook.

**Waarom:** `rank` staat in de database als momentopname van `getRanking()` op het podium, dus je hoeft niets opnieuw uit te rekenen. Tip: `Math.min(...lijst)`, en `rows.map(...)` en `rows.filter(...)`. Let op: `Math.min()` van een lege lijst is `Infinity`, vandaar de controle op `played`.

**Testen:** `npx vitest run backend/tests/summary.test.js`. In de browser: speel een ronde terwijl je als student bent ingelogd (zie "Een ronde testen" onderaan), dan kijk je op `/account`.

<details><summary>Oplossing</summary>

```js
  const bestRank = played > 0 ? Math.min(...rows.map((row) => row.rank)) : null
  const podiumCount = rows.filter((row) => row.rank <= 3).length
```
</details>

---

## S11: eigen beheerdersrol niet weghalen (story 11: docentaccount aanmaken)

**Bestand:** `backend/auth/roleRules.js`, **regel 16–20** (in `roleChangeError`).

**Wat staat er nu:** `return null` (= mag altijd). Een beheerder kan zichzelf nu per ongeluk student maken en dan niets meer terugzetten.

**Wat moet het worden:** geef `'OWN_ADMIN_ROLE'` terug als `actor.id === target.id` **en** `newRole` niet `'ADMIN'` is. Anders `null`.

**Waarom:** acceptatiecriterium van story 11: "De beheerder kan zijn eigen beheerdersrol niet per ongeluk weghalen". Je eigen rol op ADMIN laten staan is wél goed. De route (`backend/routes/admin.js`) maakt van de foutcode een 409 met melding.

**Testen:** `npx vitest run backend/tests/roleRules.test.js` (S11). In de browser: Gebruikers → jezelf bewerken → rol Student → Opslaan geeft een melding.

<details><summary>Oplossing</summary>

```js
  if (!ROLES.includes(newRole)) return 'INVALID_ROLE'
  // Haalt een beheerder per ongeluk zijn eigen beheerdersrol weg, dan kan hij niets meer terugzetten.
  if (actor.id === target.id && newRole !== 'ADMIN') return 'OWN_ADMIN_ROLE'
  return null
```
</details>

---

## S12: jezelf niet verwijderen (story 12: gebruiker aanpassen of verwijderen)

**Bestand:** `backend/auth/roleRules.js`, **regel 28–31** (in `deleteUserError`).

**Wat staat er nu:** `return null`, dus een beheerder kan zijn eigen account via de beheertabel verwijderen.

**Wat moet het worden:** geef `'DELETE_SELF'` terug als `actor.id === target.id`, anders `null`.

**Waarom:** je eigen account verwijder je via Instellingen, mét je wachtwoord als extra controle. Zo is "per ongeluk verwijderen" niet mogelijk.

**Testen:** `npx vitest run backend/tests/roleRules.test.js` (S12). In de browser: Gebruikers → prullenbak bij jezelf → melding.

<details><summary>Oplossing</summary>

```js
  // Je eigen account verwijder je via Instellingen (met wachtwoord), niet via de beheertabel.
  if (actor.id === target.id) return 'DELETE_SELF'
  return null
```
</details>

---

## S10: zoekfilter voor de gebruikerslijst (story 10: gebruikers bekijken en zoeken)

**Bestand:** `backend/db/userFilters.js`, **regel 13–15** (in `buildUserWhere`, ná `if (role) where.role = role`).

**Wat staat er nu:** filteren op rol werkt, zoeken niet: het zoekveld op `/admin/gebruikers` doet niets.

**Wat moet het worden:** als `q` niet leeg is, zet `where.OR` op een lijst met twee voorwaarden: `username` bevat `q`, of `email` bevat `q`. Allebei hoofdletterongevoelig. In Prisma schrijf je "bevat, hoofdletters maken niet uit" als:

```js
{ username: { contains: q, mode: 'insensitive' } }
```

**Waarom:** `OR` = een van de twee moet kloppen; `role` en `OR` samen = allebei (Prisma combineert velden in hetzelfde object met EN). Je bouwt alleen een object: Prisma maakt er veilige SQL van (geen SQL-injectie mogelijk).

**Testen:** `npx vitest run backend/tests/userFilters.test.js` (let op: de test verwacht eerst `username` en dan `email`). In de browser: zoek op een deel van een naam of e-mailadres.

<details><summary>Oplossing</summary>

```js
  if (role) where.role = role
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  return where
```
</details>

---

## S5: huidig wachtwoord controleren (story 5: profiel en vaardigheden aanpassen)

**Bestand:** `backend/routes/me.js`, **regel 47–51** (in `router.post('/password', ...)`).

**Wat staat er nu:** regel 51 gooit altijd `NOT_IMPLEMENTED` (501). Niemand kan nu zijn wachtwoord wijzigen.

**Wat moet het worden:**
1. Haal regel 47–51 weg.
2. Vergelijk `currentPassword` met de hash van de ingelogde gebruiker: `await verifyPassword(currentPassword, request.user.passwordHash)`. Dat geeft `true` of `false`.
3. Is het `false`: `throw new ApiError('WRONG_PASSWORD', 'Je huidige wachtwoord klopt niet.', 400)`.

Kijk naar `router.delete('/')` iets verderop: daar gebeurt bijna hetzelfde.

**Waarom:** zit iemand even achter jouw ingelogde laptop, dan kan hij zonder deze controle je wachtwoord veranderen en je account overnemen. Je gebruikt `verifyPassword` (bcrypt) en vergelijkt nooit zelf met `===`: in de database staat alleen een hash.

**Testen:** dit is een route met database, dus `npm run test:api` (Docker moet draaien). Kijk naar de tests onder "profiel en wachtwoord (story 5)" in `backend/tests/api/me.test.js`. In de browser: `/account/instellingen` → Wachtwoord wijzigen, eerst met een fout huidig wachtwoord.

<details><summary>Oplossing</summary>

```js
  const { currentPassword, newPassword } = request.body ?? {}

  const ok = await verifyPassword(currentPassword, request.user.passwordHash)
  if (!ok) throw new ApiError('WRONG_PASSWORD', 'Je huidige wachtwoord klopt niet.', 400)

  const password = parsePassword(newPassword)
```
</details>

---

## S6: bevestigingswoord (story 6: account verwijderen)

**Bestand:** `src/utils/confirmDelete.js`, **regel 11–15** (de functie `isDeleteConfirmed`).

**Wat staat er nu:** `return false`, dus de knop "Ja, verwijder mijn account" blijft altijd uit.

**Wat moet het worden:** `true` als `typed`, zonder spaties aan begin en eind, precies gelijk is aan `DELETE_CONFIRM_WORD` (`'VERWIJDER'`). Hoofdletters tellen wél: `verwijder` is niet genoeg. `typed` kan `undefined` zijn, en dan mag je code niet crashen.

**Waarom:** acceptatiecriterium "Per ongeluk verwijderen is zo goed als onmogelijk". De pagina (`src/pages/Account/DeleteAccount.jsx`) gebruikt deze functie voor de knop; de server vraagt daarnaast ook nog je wachtwoord. Tip: `String(typed ?? '')` maakt van `undefined` een lege tekst, en `.trim()` haalt de spaties weg.

**Testen:** `npx vitest run backend/tests/confirmDelete.test.js`. In de browser: Instellingen → Verwijderen → typ `VERWIJDER` + wachtwoord. Doe dit met een testaccount!

<details><summary>Oplossing</summary>

```js
export function isDeleteConfirmed(typed) {
  return String(typed ?? '').trim() === DELETE_CONFIRM_WORD
}
```
</details>

---

## S8: standaardinstellingen samenvoegen (story 8: standaardinstellingen voor quizzen)

**Bestand:** `backend/quiz/quizRules.js`, **regel 43–47** (de functie `applyQuizDefaults`).

**Wat staat er nu:** `return { ...defaults }`: altijd de standaard van de docent, en wat hij bij de quiz zelf koos, wordt genegeerd.

**Wat moet het worden:** een object met de vier instellingen `timePerQuestion`, `showCorrectAnswer`, `showStandings` en `lockLobbyOnStart`. Per instelling: de waarde uit `settings`, behalve als die `undefined` is; dan de waarde uit `defaults`.

**Waarom:** de valkuil zit bij `false`. `settings.showCorrectAnswer || defaults.showCorrectAnswer` gaat fout als de docent bewust `false` kiest, want `||` ziet `false` als "leeg". Gebruik de operator `??` (nullish coalescing): die kijkt alleen naar `null` en `undefined`.

**Testen:** `npx vitest run backend/tests/quizRules.test.js` (S8). In de browser: Mijn account (admin) → zet "Tussenstand tonen" uit → Opslaan → Nieuwe quiz: de schakelaar staat uit. Zet hem in de editor weer aan en sla op: dan blijft hij aan.

<details><summary>Oplossing</summary>

```js
export function applyQuizDefaults(defaults, settings) {
  return {
    timePerQuestion: settings.timePerQuestion ?? defaults.timePerQuestion,
    showCorrectAnswer: settings.showCorrectAnswer ?? defaults.showCorrectAnswer,
    showStandings: settings.showStandings ?? defaults.showStandings,
    lockLobbyOnStart: settings.lockLobbyOnStart ?? defaults.lockLobbyOnStart,
  }
}
```
</details>

---

## S9: apparaatlabel (story 9: ingelogde apparaten beheren)

**Bestand:** `backend/auth/deviceLabel.js`, **regel 8–11** (de functie `deviceLabel`).

**Wat staat er nu:** altijd `'Onbekend apparaat'`, dus in de lijst "Ingelogd op" ziet elk apparaat er hetzelfde uit.

**Wat moet het worden:** van de User-Agent (de tekst die de browser over zichzelf meestuurt) een label maken:
1. Leeg of `undefined` → `'Onbekend apparaat'`.
2. Apparaat: bevat `iPad` of `Tablet` → `'Tablet'`; anders bevat `Mobi`, `iPhone` of `Android` → `'Telefoon'`; anders `'Computer'`.
3. Browser: bevat `Edg/` → `'Edge'`; anders `Firefox/` → `'Firefox'`; anders `Chrome/` → `'Chrome'`; anders `Safari/` → `'Safari'`; anders geen browser.
4. Resultaat: `'Telefoon · Safari'` (met de tekens spatie, `·`, spatie), of alleen het apparaat als de browser onbekend is.

**Waarom:** de **volgorde** is de valkuil. Edge zet ook `Chrome/` in zijn User-Agent, en Chrome zet ook `Safari/` erin, dus je moet de specifiekste eerst testen. We bewaren alleen dit korte label en nooit het IP-adres of de hele User-Agent: minder persoonsgegevens (AVG).

**Testen:** `npx vitest run backend/tests/deviceLabel.test.js` (de test bevat echte User-Agents). In de browser: log in op je laptop én je telefoon (via `http://<ip-van-je-laptop>:5173`), dan zie je bij Mijn account (admin) twee apparaten. Labels van eerdere sessies veranderen niet: log opnieuw in.

<details><summary>Oplossing</summary>

```js
export function deviceLabel(userAgent) {
  const ua = String(userAgent ?? '')
  if (!ua) return 'Onbekend apparaat'

  // Volgorde telt: een iPad noemt zich soms ook "Mobile", en Edge noemt zich ook "Chrome".
  const device = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Telefoon' : 'Computer'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : null

  return browser ? `${device} · ${browser}` : device
}
```
</details>

---

## Alles controleren

```bash
npm test               # 95 tests, 0 failed = S1–S4 en S6–S12 goed (S5 zit niet in deze snelle tests)
npm run test:api       # 83 API-tests tegen de testdatabase, ook S5; Docker moet draaien
npm run test:smoke     # de hele flow tegen http://localhost:5173: beheerder, docent, quiz, live ronde, uitslag
grep -rn "USER IMPLEMENTATION (S" backend src   # moet niets meer vinden
```

`test:api` en `test:smoke` slagen pas helemaal als alle opdrachten af zijn. De rooktest heeft vooral S2 (hosten en admin) en S3 (uitnodigingslink) nodig.

### Een ronde testen in de browser

1. Log in als beheerder → Gebruikers → **Docent toevoegen** → kopieer de link → open hem in een privévenster → kies een wachtwoord.
2. Log als docent in → **Nieuwe quiz** (zet hem op "Klaar om te hosten") → **Hosten**.
3. Op je telefoon of in een ander privévenster: maak een studentaccount, ga naar `/join`, en vul de code in. Doe in nog een venster mee als gast (minstens 2 spelers).
4. Speel de quiz tot het podium. Kijk daarna bij de student op **Mijn account** en bij de docent op **Uitslagen**.

---

## Laat Claude je werk controleren

Klaar? Kopieer deze zin en stuur hem naar Claude (Claude Code in deze repo):

```
Controleer mijn USER IMPLEMENTATION-opdrachten S1 t/m S12 uit docs/SPRINT-2-ZELF-IMPLEMENTEREN.md: vergelijk per opdracht wat ik in de code heb geschreven met wat de opdracht vraagt, draai npm test, npm run test:api en npm run test:smoke, en vertel me per opdracht of het klopt, veilig is en werkt, en wat ik nog moet verbeteren.
```
