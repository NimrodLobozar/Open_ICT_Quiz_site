# E-mail (story 13)

De site stuurt drie soorten mail: de **uitnodiging** voor een nieuwe docent, **wachtwoord vergeten** en de **bevestigingsmail** na registreren (story 14). Alles gaat via [`backend/mail/sendMail.js`](../backend/mail/sendMail.js), met SMTP (`nodemailer`). Welke mailserver dat is, bepalen alleen de omgevingsvariabelen. Wisselen van dienst kan dus zonder de code aan te passen.

| Situatie | Waar gaan de mails heen? |
|---|---|
| Development met Docker (standaard) | **Mailpit**, een nep-mailserver. Niets gaat naar buiten. Bekijk de mails op http://localhost:8025 |
| Development met Gmail (of Brevo) in `.env` | Echt naar de ontvanger |
| Zonder Docker en zonder `SMTP_HOST` | In de log van de backend |
| `npm test` en `npm run test:api` | Nergens: ze komen in de lijst `outbox` in het geheugen, waar de tests de link uit lezen. `.env` doet hier niet mee |
| `npm run test:smoke` en `npm run test:visual` | **Mailpit**, altijd: ze draaien tegen een aparte test-backend die `test.env` leest in plaats van `.env` (zie hieronder) |
| Productie zonder `SMTP_HOST` | Nergens (met een waarschuwing in de log). De link staat dan nooit in de log, want wie de log leest, zou anders accounts kunnen overnemen |

## Echte mails met Gmail (aanbevolen)

Wij versturen via het Gmail-account van de quiz (`openictquiz@gmail.com`). Waarom Gmail en niet Brevo? Studenten hebben Microsoft 365 (Outlook). Via Brevo duurde de **eerste** mail aan een student 1 tot 5 minuten; latere mails aan dezelfde student kwamen meteen. Microsoft vertrouwt een onbekende afzender niet en zegt eerst "probeer het later opnieuw". Via Brevo is de afzender extra verdacht: de mail komt "van" een Gmail-adres, maar Google heeft hem niet ondertekend. Via `smtp.gmail.com` verstuurt Google de mail zelf en ondertekent hij hem ook (SPF, DKIM en DMARC kloppen). Google staat bij Microsoft goed bekend, dus de eerste mail komt veel sneller aan.

1. **Tweestapsverificatie:** log in op het Gmail-account, ga naar https://myaccount.google.com/security en zet **2-Step Verification** aan. Zonder kun je geen app-wachtwoord maken.
2. **App-wachtwoord:** ga naar https://myaccount.google.com/apppasswords, geef een naam (bijv. `Open ICT Quiz`) en klik op *Create*. Kopieer de 16 tekens meteen, want je ziet ze maar één keer.
3. **`.env`** in de hoofdmap van het project (staat in `.gitignore`, dus komt nooit in git). Plak het app-wachtwoord **zonder spaties**:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=openictquiz@gmail.com
   SMTP_PASS=<app-wachtwoord, 16 tekens>
   MAIL_FROM=openictquiz@gmail.com
   ```

   `MAIL_FROM` moet hetzelfde adres zijn als `SMTP_USER`. Poort 465 is meteen versleuteld; `sendMail.js` zet dan zelf `secure: true`.
4. **Herstarten:** `docker compose up -d backend`. Docker leest `.env` alleen bij het (opnieuw) aanmaken van de container.
5. **Testen:** registreer met een `@student.hu.nl`-adres dat nog nooit mail van de quiz kreeg. In `docker compose logs backend` staat dan `Mail "..." afgegeven bij smtp.gmail.com`. Zie je `Invalid login` of `535`, dan klopt het app-wachtwoord niet (of staan er spaties in).

Goed om te weten:
- Gratis Gmail verstuurt maximaal ongeveer **500 mails per dag**. Voor een klas is dat ruim genoeg.
- Met het app-wachtwoord kun je ook de mailbox lezen. Gebruik daarom een apart Gmail-account voor de quiz, nooit je eigen account, en zet het wachtwoord alleen in `.env`.
- Gmail geeft geen logs zoals Brevo. Komt een mail niet aan, kijk dan in de map *Verzonden* van het Gmail-account en in `docker compose logs backend`.

## Alternatief: Brevo

Brevo is gratis tot 300 mails per dag, en de site logt in met een aparte SMTP-sleutel in plaats van een app-wachtwoord. Bij Microsoft 365 was Brevo wel trager (zie hierboven). Met een eigen domein werkt Brevo beter (zie *Komen de mails bij Ongewenste e-mail?*).

1. **Account:** maak een gratis account op brevo.com.
2. **Afzender bevestigen:** ga naar *Senders, Domains & Dedicated IPs → Senders → Add a sender*. Naam `Open ICT Quiz`, en als adres een Gmail-adres van het team (wij gebruiken een apart Gmail-account voor de quiz). Brevo stuurt een mail naar dat adres; klik op de link. Alleen een bevestigd adres mag als afzender.
   **Niet** een `@student.hu.nl`- of `@hu.nl`-adres: de HU zegt in haar DNS (DMARC `p=reject`) dat mail "van" een HU-adres die niet door de HU zelf is ondertekend, geweigerd moet worden. Brevo meldt de mail dan als *Delivered*, maar Microsoft blokkeert hem daarna (*soft bounce: access denied*), en hij komt nooit in de inbox. Een "opening" in de Brevo-log op hetzelfde moment is de virusscanner van Microsoft, niet de ontvanger.
3. **SMTP-sleutel:** ga naar *SMTP & API → SMTP* (rechtsboven onder je naam). Daar staan de **SMTP server** (`smtp-relay.brevo.com`), de **port** (`587`) en je **login** (iets als `xxxx@smtp-brevo.com`; dat is *niet* je eigen e-mailadres). Klik op *Generate a new SMTP key* en kopieer de sleutel meteen, want je ziet hem maar één keer.
4. **`.env`** in de hoofdmap van het project (naast `docker-compose.yml`; staat in `.gitignore`, dus komt nooit in git):

   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=xxxx@smtp-brevo.com
   SMTP_PASS=<je SMTP-sleutel>
   MAIL_FROM=<het adres uit stap 2>
   ```

5. **Herstarten:** `docker compose up -d backend`. Docker leest `.env` alleen bij het (opnieuw) aanmaken van de container; nodemon ziet deze wijziging niet.
6. **Testen:** registreer op http://localhost:5173/registreren met je eigen `@student.hu.nl`-adres. Komt de bevestigingsmail aan? Kijk ook in de spammap. Gaat het mis, dan staat de fout in `docker compose logs backend` (`Bevestigingsmail niet verstuurd: ...`).

Terug naar Mailpit: haal de vijf regels weg uit `.env` (of zet er `#` voor) en herstart de backend.

## Testen terwijl Gmail of Brevo in `.env` staat

`npm run test:smoke` en `npm run test:visual` registreren verzonnen HU-adressen. Mails naar adressen die niet bestaan, zijn slecht voor de naam van je afzender, dus die mogen nooit via Gmail of Brevo gaan. Daarom draaien deze tests tegen een **tweede backend**: de dienst `backend-test` in `docker-compose.yml`, op http://localhost:3001.

- `backend` (de gewone site) leest de mail-instellingen uit `.env`: Gmail of Brevo, als je dat hebt ingesteld.
- `backend-test` leest ze uit [`test.env`](../test.env): altijd Mailpit. Dat bestand bevat geen geheimen en staat in git.
- Beide gebruiken dezelfde database en dezelfde code.

Je hoeft dus niets aan `.env` te veranderen om te testen. Het script [`scripts/with-test-backend.mjs`](../scripts/with-test-backend.mjs) start `backend-test` (`docker compose --profile test up -d --build backend-test`), wacht tot hij klaar is en draait dan de test. Bij een gewone `docker compose up` start `backend-test` niet mee (dat regelt `profiles: ["test"]`). Stoppen: `docker compose stop backend-test`.

Geef je zelf een adres op (`SMOKE_URL=...` of `VISUAL_URL=...`), dan start het script niets en test het tegen dat adres. Wijst dat adres naar de gewone site, dan gebruikt die wél `.env`.

## Komen de mails bij Ongewenste e-mail?

Ook via Gmail zet Microsoft 365 de mail soms bij **Ongewenste e-mail**. De afzender is een nieuw, gratis Gmail-account, en "bevestig je e-mailadres" met een link lijkt op phishing. Dat beslist Microsoft; met instellingen in dit project kun je het niet helemaal voorkomen.

- **Op de site:** overal waar net een mail is verstuurd, staat de melding "Geen mail? Kijk ook in je map Ongewenste e-mail" (`JunkMailHint` in [`src/components/AccountUi.jsx`](../src/components/AccountUi.jsx), getoond door de knop *Mail opnieuw sturen* in [`ResendVerification.jsx`](../src/pages/Auth/ResendVerification.jsx)).
- **Per student:** klikt een student op *Geen ongewenste e-mail*, dan komen volgende mails bij die student in de inbox.
- **Voor iedereen tegelijk:** vraag de ICT-afdeling van de HU om `openictquiz@gmail.com` op hun lijst met vertrouwde afzenders te zetten.
- **Op termijn:** een eigen domein (ongeveer €10 per jaar), gekoppeld aan Brevo (*Domains → Add a domain*, en dan de DNS-records die Brevo laat zien). Zet daarna `MAIL_FROM` op een adres van dat domein. Een goed ingesteld eigen domein vertrouwt Microsoft meer dan een gratis Gmail-adres.
- Vraag ook na of de HU een SMTP-server voor studentprojecten heeft. Die vul je dan op dezelfde manier in `.env` in.
- **Waarom zit een mail bij Ongewenste e-mail?** Open hem in Outlook en bekijk de berichtkoppen (*Berichtdetails*). Bij `Authentication-Results` moet `spf=pass`, `dkim=pass` en `dmarc=pass` staan. In `X-Forefront-Antispam-Report` betekent `SCL:5` of hoger: ongewenste e-mail.

## Wat de site doet als de mail mislukt

- **Docent toevoegen:** het account wordt wel gemaakt. Het antwoord bevat `mailSent: false` en de link zelf; de beheerder ziet een waarschuwing met **Uitnodiging opnieuw sturen** en kan de link ook kopiëren. In de gebruikerslijst staat die knop ook bij elke docent die nog niet geactiveerd is.
- **Registreren, bevestigingsmail opnieuw sturen en wachtwoord vergeten:** het antwoord wacht niet op de mail en is altijd hetzelfde (zo verraden we niet welke adressen bestaan). Een fout staat alleen in de log; de speler kan de mail opnieuw aanvragen.
- **Trage maildienst:** na ongeveer 10 seconden geeft de verbinding het op (`connectionTimeout` in `sendMail.js`), zodat de site niet blijft hangen.
