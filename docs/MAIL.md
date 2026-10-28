# E-mail (story 13)

De site stuurt drie soorten mail: de **uitnodiging** voor een nieuwe docent, **wachtwoord vergeten** en de **bevestigingsmail** na registreren (story 14). Alles gaat via [`backend/mail/sendMail.js`](../backend/mail/sendMail.js), met SMTP (`nodemailer`). Welke mailserver dat is, bepalen alleen de omgevingsvariabelen. Wisselen van dienst kan dus zonder de code aan te passen.

| Situatie | Waar gaan de mails heen? |
|---|---|
| Development met Docker (standaard) | **Mailpit**, een nep-mailserver. Niets gaat naar buiten. Bekijk de mails op http://localhost:8025 |
| Development met Brevo in `.env` | Echt naar de ontvanger |
| Zonder Docker en zonder `SMTP_HOST` | In de log van de backend |
| `npm test` en `npm run test:api` | Nergens: ze komen in de lijst `outbox` in het geheugen, waar de tests de link uit lezen. `.env` doet hier niet mee |
| `npm run test:smoke` en `npm run test:visual` | **Mailpit**, altijd: ze draaien tegen een aparte test-backend die `test.env` leest in plaats van `.env` (zie hieronder) |
| Productie zonder `SMTP_HOST` | Nergens (met een waarschuwing in de log). De link staat dan nooit in de log, want wie de log leest, zou anders accounts kunnen overnemen |

## Echte mails met Brevo

Brevo is gratis tot 300 mails per dag. Je hebt geen Gmail-wachtwoord of persoonlijke mailbox nodig: de site logt alleen in bij Brevo, met een aparte SMTP-sleutel.

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

## Testen terwijl Brevo in `.env` staat

`npm run test:smoke` en `npm run test:visual` registreren verzonnen HU-adressen. Mails naar adressen die niet bestaan, zijn slecht voor de naam van je afzender, dus die mogen nooit via Brevo gaan. Daarom draaien deze tests tegen een **tweede backend**: de dienst `backend-test` in `docker-compose.yml`, op http://localhost:3001.

- `backend` (de gewone site) leest de mail-instellingen uit `.env`: Brevo, als je dat hebt ingesteld.
- `backend-test` leest ze uit [`test.env`](../test.env): altijd Mailpit. Dat bestand bevat geen geheimen en staat in git.
- Beide gebruiken dezelfde database en dezelfde code.

Je hoeft dus niets aan `.env` te veranderen om te testen. Het script [`scripts/with-test-backend.mjs`](../scripts/with-test-backend.mjs) start `backend-test` (`docker compose --profile test up -d --build backend-test`), wacht tot hij klaar is en draait dan de test. Bij een gewone `docker compose up` start `backend-test` niet mee (dat regelt `profiles: ["test"]`). Stoppen: `docker compose stop backend-test`.

Geef je zelf een adres op (`SMOKE_URL=...` of `VISUAL_URL=...`), dan start het script niets en test het tegen dat adres. Wijst dat adres naar de gewone site, dan gebruikt die wél `.env`.

## Komen de mails in de spam?

- Zonder eigen domein verstuurt Brevo namens een Gmail-adres, terwijl Google de mail niet zelf ondertekent. Sommige mailservers vinden dat verdacht en zetten hem in Ongewenste e-mail.
- Waarom Brevo en niet Gmail zelf via SMTP? Dan logt de site in met een app-wachtwoord van het Gmail-account (daarmee kun je ook de mailbox lezen), Google blokkeert soms nieuwe accounts die automatisch mailen, en je ziet geen logs. Wisselen kan altijd: alleen `.env` verandert (`smtp.gmail.com`, poort 465, app-wachtwoord).
- Beter: een eigen domein (ongeveer €10 per jaar) dat je in Brevo koppelt (*Domains → Add a domain*, en dan de DNS-records die Brevo laat zien). Zet daarna `MAIL_FROM` op een adres van dat domein.
- Vraag ook na of de HU een SMTP-server voor studentprojecten heeft. Die vul je dan op dezelfde manier in `.env` in.

## Wat de site doet als de mail mislukt

- **Docent toevoegen:** het account wordt wel gemaakt. Het antwoord bevat `mailSent: false` en de link zelf; de beheerder ziet een waarschuwing met **Uitnodiging opnieuw sturen** en kan de link ook kopiëren. In de gebruikerslijst staat die knop ook bij elke docent die nog niet geactiveerd is.
- **Registreren, bevestigingsmail opnieuw sturen en wachtwoord vergeten:** het antwoord wacht niet op de mail en is altijd hetzelfde (zo verraden we niet welke adressen bestaan). Een fout staat alleen in de log; de speler kan de mail opnieuw aanvragen.
- **Trage maildienst:** na ongeveer 10 seconden geeft de verbinding het op (`connectionTimeout` in `sendMail.js`), zodat de site niet blijft hangen.
