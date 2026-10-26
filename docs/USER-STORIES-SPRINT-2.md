# User stories sprint 2: accounts, inloggen en admin-portaal

User stories en taken bij de designs voor inloggen, het studentaccount en het admin-portaal.
De designs staan op het canvas: https://claude.ai/artifact/BqhGC5qi1hAxFUk9SdMQC5

- **Rollen:** speler (student), docent en beheerder, net als in de designs.
- **Prioriteiten** zijn een voorstel; stem ze af met het team.
- **Volgorde:** story 1 en 2 eerst, want bijna alles heeft de `User`-tabel en het inloggen nodig. Story 7 heeft eerst de nieuwe `Quiz`-tabel nodig.
- Testtaken staan er niet apart in. Wil het team dat wel, voeg dan per story een taak "[Test]" toe voor de backend-endpoints (`npm test`, vitest).

## Overzicht

| # | Story | Rol | Prioriteit |
|---|---|---|---|
| 1 | Account aanmaken | Speler | Must |
| 2 | Inloggen en uitloggen | Speler | Must |
| 3 | Wachtwoord vergeten | Speler | Should |
| 4 | Eigen resultaten terugkijken | Speler | Must |
| 5 | Profiel en vaardigheden aanpassen | Speler | Should |
| 6 | Account verwijderen | Speler | Should |
| 7 | Quizzen beheren en hosten | Docent | Must |
| 8 | Standaardinstellingen voor quizzen | Docent | Could |
| 9 | Ingelogde apparaten beheren | Docent | Good to have |
| 10 | Gebruikers bekijken en zoeken | Beheerder | Should |
| 11 | Docentaccount aanmaken | Beheerder | Must |
| 12 | Gebruiker aanpassen of verwijderen | Beheerder | Could |

---

## 1. Account aanmaken

Als speler
wil ik een eigen account kunnen aanmaken,
zodat mijn scores en voortgang bewaard blijven.

**PRIORITEIT:** Must

**ACCEPTATIECRITERIA:**
- De speler kan een account aanmaken met een gebruikersnaam, e-mailadres en wachtwoord.
- De speler ziet tijdens het typen of het wachtwoord aan de eisen voldoet.
- Een account aanmaken met een e-mailadres dat al bestaat, lukt niet en de speler krijgt een duidelijke melding.
- De speler moet akkoord gaan met de privacyregels voordat het account wordt aangemaakt.
- Na het aanmaken is de speler direct ingelogd.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Wachtwoorden worden nooit leesbaar opgeslagen.
- Foutmeldingen leggen in gewone taal uit wat er mis is.
- Het formulier werkt ook goed op een telefoon en met alleen een toetsenbord.

### Taken

**[Backend] User-tabel en registratie-endpoint**
Voeg een `User`-model toe aan `prisma/schema.prisma` (naam, e-mail uniek, wachtwoord-hash, rol, vaardigheden, aangemaakt-op). Maak `POST /api/auth/register`: invoer controleren, wachtwoord hashen (bcrypt), dubbel e-mailadres weigeren met een duidelijke foutcode.
*Klaar als:* een account in de database staat met een gehasht wachtwoord, en een dubbel e-mailadres een fout geeft.

**[Frontend] Registratiepagina**
Bouw de pagina `/registreren` volgens het design "Account maken": velden, wachtwoordsterkte, privacy-checkbox en foutmeldingen. Na het aanmaken is de speler ingelogd en gaat hij naar "Mijn account".
*Klaar als:* een speler zich via de pagina kan registreren en fouten ziet zonder dat de pagina herlaadt.

---

## 2. Inloggen en uitloggen

Als speler
wil ik kunnen inloggen en uitloggen,
zodat alleen ik bij mijn account kan.

**PRIORITEIT:** Must

**ACCEPTATIECRITERIA:**
- De speler kan inloggen met e-mailadres en wachtwoord.
- Bij een fout e-mailadres of wachtwoord ziet de speler een melding, zonder te verraden welk van de twee fout is.
- De speler kan kiezen om ingelogd te blijven op dit apparaat.
- De speler kan op elk scherm uitloggen.
- Meedoen aan een quiz met een code blijft mogelijk zonder account.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Na het uitloggen zijn eigen gegevens niet meer te zien, ook niet via de terugknop.
- Inloggen voelt snel aan (binnen een paar seconden).
- Het inlogscherm past qua stijl bij de rest van de quiz.

### Taken

**[Backend] Login, logout en auth-middleware**
Maak `POST /api/auth/login` en `POST /api/auth/logout` met een httpOnly-sessiecookie (op dezelfde manier als de game-cookies). Voeg middleware `requireAuth` en `requireRole(...)` toe voor beveiligde routes.
*Klaar als:* een ingelogde gebruiker beveiligde routes kan openen, en dat na het uitloggen niet meer lukt.

**[Frontend] Inlogpagina en ingelogde status in de navigatiebalk**
Bouw `/inloggen` (desktop en telefoon) met de wisselknop Inloggen/Account maken en een algemene foutmelding. Laat in `QuizHeader` "Profiel" en "Uitloggen" zien als je bent ingelogd, en anders "Inloggen".
*Klaar als:* inloggen en uitloggen werken, en de navigatiebalk de juiste knoppen toont.

---

## 3. Wachtwoord vergeten

Als speler
wil ik een nieuw wachtwoord kunnen instellen als ik het mijne vergeten ben,
zodat ik mijn account en scores niet kwijtraak.

**PRIORITEIT:** Should

**ACCEPTATIECRITERIA:**
- De speler kan vanaf het inlogscherm een nieuw wachtwoord aanvragen.
- De speler ontvangt een link om een nieuw wachtwoord in te stellen.
- De link werkt maar één keer en verloopt na een bepaalde tijd.
- De speler krijgt dezelfde melding, of het e-mailadres nu bestaat of niet.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Het proces kan niet misbruikt worden om accounts over te nemen.
- De stappen zijn zonder uitleg te volgen.
- De e-mail is duidelijk herkenbaar als bericht van de Open ICT Quiz.

### Taken

**[Backend] Reset-token en e-mail**
Maak een tabel voor reset-tokens (gehasht, eenmalig, met een verloopdatum). Maak de endpoints `POST /api/auth/forgot` (geeft altijd hetzelfde antwoord) en `POST /api/auth/reset`. Kies een manier om e-mail te versturen (in dev: tonen in de log).
*Klaar als:* je met een geldige link een nieuw wachtwoord kunt instellen, en een gebruikte of verlopen link niet meer werkt.

**[Frontend] Pagina's voor aanvragen en nieuw wachtwoord**
Bouw twee pagina's: e-mailadres invullen, en een nieuw wachtwoord kiezen via de link. Gebruik dezelfde stijl als het inlogscherm.
*Klaar als:* de hele flow werkt, van "Wachtwoord vergeten?" tot opnieuw inloggen.

---

## 4. Eigen resultaten terugkijken

Als speler
wil ik mijn eerdere scores kunnen terugkijken,
zodat ik mijn groei kan zien.

**PRIORITEIT:** Must

**ACCEPTATIECRITERIA:**
- De speler ziet een overzicht van gespeelde quizzen met plaats, score en datum.
- De speler ziet een samenvatting van zijn resultaten, zoals het aantal gespeelde quizzen en de beste plaats.
- Bij het aanmaken van een account vult de speler startwaarden in (zoals vaardigheden) als beginpunt.
- Alleen de speler zelf kan deze informatie zien.
- Een nieuwe speler zonder gespeelde quizzen ziet een duidelijke lege staat in plaats van een fout.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- De getoonde plaatsen komen overeen met de eindstand van die ronde.
- Het overzicht is ook op een telefoon goed leesbaar.
- Persoonlijke gegevens zijn nergens zichtbaar voor andere spelers.

### Taken

**[Backend] Resultaten koppelen aan een account**
Voeg een optionele `userId` toe aan `GameResult`. Speelt een ingelogde speler mee, sla dan zijn `userId` op in `backend/db/gameResults.js`. Maak `GET /api/me/results` met een samenvatting (aantal gespeeld, beste plaats, podiumplaatsen) en een lijst van recente rondes.
*Klaar als:* een ingelogde speler na een ronde zijn resultaat via de API terugziet, en een andere gebruiker dat niet kan opvragen.

**[Frontend] Pagina "Mijn account"**
Bouw de accountpagina (desktop en telefoon): profielkaart, cijfertegels, vaardigheden en "Laatst gespeeld". Laat een lege staat zien als er nog niets gespeeld is.
*Klaar als:* de pagina echte data toont en de plaatsen overeenkomen met de eindstand (`getRanking`).

**[Frontend + Backend] Startwaarden bij registratie**
Voeg de vaardigheden (SD, AI, TI, CSC, GD, BI) toe aan de registratie en sla ze op als startpunt.
*Klaar als:* een nieuw account startwaarden heeft die op "Mijn account" te zien zijn.

> Let op: in het design kun je de vaardigheden nu alleen later bij "Instellingen" invullen, niet op het scherm "Account maken". Pas het design aan als het team ze bij de registratie wil.

---

## 5. Profiel en vaardigheden aanpassen

Als speler
wil ik mijn gegevens en vaardigheden kunnen aanpassen,
zodat mijn profiel klopt met hoe ik er nu voor sta.

**PRIORITEIT:** Should

**ACCEPTATIECRITERIA:**
- De speler kan zijn gebruikersnaam en e-mailadres wijzigen.
- De speler kan zijn vaardigheden per onderdeel bijwerken.
- De speler kan zijn wachtwoord wijzigen na het invullen van het huidige wachtwoord.
- Na het opslaan ziet de speler een bevestiging.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Ongeldige invoer wordt vóór het opslaan gemeld.
- Wijzigingen zijn direct zichtbaar op het accountscherm.
- Het scherm is te bedienen met toetsenbord en schermlezer.

### Taken

**[Backend] Endpoints voor profiel en wachtwoord**
Maak `PATCH /api/me` (naam, e-mail, vaardigheden) en `POST /api/me/password` (vraagt het huidige wachtwoord). Controleer de invoer.
*Klaar als:* wijzigingen worden opgeslagen, en een fout huidig wachtwoord wordt geweigerd.

**[Frontend] Instellingenpagina**
Bouw de pagina "Instellingen" met de secties Profiel, Vaardigheden en Wachtwoord. Toon een bevestiging na het opslaan.
*Klaar als:* de speler alles kan aanpassen en de wijziging direct ziet op "Mijn account".

---

## 6. Account verwijderen

Als speler
wil ik mijn account kunnen verwijderen,
zodat mijn gegevens niet bewaard blijven als ik stop.

**PRIORITEIT:** Should

**ACCEPTATIECRITERIA:**
- De speler kan zijn account verwijderen vanuit de instellingen.
- De speler moet het verwijderen eerst bevestigen.
- Na het verwijderen zijn het profiel en de bewaarde scores gewist.
- De speler wordt daarna uitgelogd.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Het verwijderen voldoet aan de privacyregels (AVG).
- Per ongeluk verwijderen is zo goed als onmogelijk.
- Gedeelde uitslagen van anderen blijven kloppen nadat een speler is verwijderd.

### Taken

**[Backend] Account verwijderen**
Maak `DELETE /api/me`: verwijder de gebruiker en zet `userId` in zijn `GameResult`-rijen op leeg, zodat de uitslagen van anderen blijven kloppen. Log de gebruiker daarna uit.
*Klaar als:* het account weg is en oude eindstanden nog werken.

**[Frontend] Verwijderblok met bevestiging**
Voeg het blok "Account verwijderen" toe aan de instellingen, met een bevestigingsstap. Stuur de speler na het verwijderen naar de startpagina.
*Klaar als:* verwijderen alleen lukt na bevestiging.

---

## 7. Quizzen beheren en hosten

Als docent
wil ik een overzicht van mijn quizzen hebben en er één kunnen starten,
zodat ik snel een quiz in de klas kan spelen.

**PRIORITEIT:** Must

**ACCEPTATIECRITERIA:**
- De docent ziet een lijst van zijn eigen quizzen met de status (klaar of concept).
- De docent kan in de lijst zoeken op naam.
- De docent kan een quiz die klaar is direct hosten.
- Een concept-quiz kan niet gehost worden.
- De docent kan vanuit het overzicht een nieuwe quiz maken of een bestaande bewerken.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Het overzicht laadt snel, ook met veel quizzen.
- De belangrijkste actie (hosten) is direct te vinden.
- Alleen ingelogde docenten en beheerders kunnen bij dit overzicht.

### Taken

**[Database] Quiz- en Vraag-tabellen**
Maak de modellen `Quiz` en `Question` (eigenaar, titel, status klaar/concept), zodat de vragen uit de database komen in plaats van uit `backend/game/quizQuestions.js`. Voeg seed-data toe met de huidige vragen.
*Klaar als:* een game de vragen uit de database laadt.

**[Backend] Quiz-endpoints en hosten met quizId**
Maak `GET /api/quizzes` (eigen quizzen, met zoekfunctie). Laat het hosten een `quizId` meekrijgen en weiger het hosten van een concept-quiz.
*Klaar als:* een docent alleen zijn eigen quizzen ziet en alleen quizzen met status "klaar" kan starten.

**[Frontend] Admin-overzicht**
Bouw het admin-portaal met zijmenu en de pagina "Overzicht": cijfertegels, quizlijst met statuslabel, zoeken, en de knoppen "Hosten" en "Bewerken".
*Klaar als:* "Hosten" een echte game start met de gekozen quiz.

---

## 8. Standaardinstellingen voor quizzen

Als docent
wil ik standaardinstellingen kunnen kiezen voor nieuwe quizzen,
zodat ik niet bij elke quiz opnieuw hetzelfde hoef in te stellen.

**PRIORITEIT:** Could

**ACCEPTATIECRITERIA:**
- De docent kan een standaardtijd per vraag kiezen.
- De docent kan instellen of het goede antwoord en de tussenstand na elke vraag worden getoond.
- Een nieuwe quiz neemt deze instellingen automatisch over.
- De docent kan de instellingen per quiz nog aanpassen.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Het is duidelijk welke instelling aan of uit staat.
- Aangepaste instellingen veranderen geen quizzen die al bestaan.
- De instellingen blijven bewaard na uitloggen.

### Taken

**[Backend] Instellingen opslaan**
Sla per docent de standaardinstellingen op (tijd per vraag, antwoord tonen, tussenstand tonen, lobby dicht bij de start). Een nieuwe quiz neemt ze over.
*Klaar als:* een nieuwe quiz met de standaardinstellingen van de docent start.

**[Frontend] Instellingenblok op "Mijn account" (admin)**
Bouw het blok met de keuzelijst en de schakelaars, en sla de keuzes op.
*Klaar als:* de instellingen bewaard blijven na uitloggen.

---

## 9. Ingelogde apparaten beheren

Als docent
wil ik zien op welke apparaten ik ben ingelogd,
zodat ik kan uitloggen op een lokaalcomputer die ik vergeten ben.

**PRIORITEIT:** Good to have

**ACCEPTATIECRITERIA:**
- De docent ziet een lijst van apparaten waarop hij is ingelogd, met wanneer ze voor het laatst actief waren.
- Het huidige apparaat is herkenbaar in de lijst.
- De docent kan in één keer op alle andere apparaten uitloggen.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Na "overal uitloggen" werkt een oude sessie echt niet meer.
- De lijst toont geen gevoelige gegevens zoals volledige IP-adressen.
- De functie is ook goed te gebruiken op een telefoon.

### Taken

**[Backend] Sessietabel**
Sla sessies op in een tabel (apparaattype, laatst actief). Maak `GET /api/me/sessions` en `POST /api/me/sessions/revoke-others`.
*Klaar als:* een ingetrokken sessie niet meer werkt.

**[Frontend] Lijst "Ingelogd op"**
Toon de apparaten, markeer het huidige apparaat en voeg de knop "Overal uitloggen" toe.
*Klaar als:* de lijst klopt en de knop andere sessies uitlogt.

---

## 10. Gebruikers bekijken en zoeken

Als beheerder
wil ik een overzicht van alle gebruikers kunnen bekijken en doorzoeken,
zodat ik snel de juiste persoon kan vinden.

**PRIORITEIT:** Should

**ACCEPTATIECRITERIA:**
- De beheerder ziet alle gebruikers met naam, e-mailadres, rol en laatste activiteit.
- De beheerder kan filteren op rol (student, docent, beheerder).
- De beheerder kan zoeken op naam of e-mailadres.
- Bij veel gebruikers is de lijst verdeeld over pagina's.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Alleen beheerders kunnen dit overzicht openen.
- Zoeken en filteren geven binnen een seconde resultaat.
- De tabel is ook op een kleiner scherm te gebruiken.

### Taken

**[Backend] Endpoint gebruikerslijst**
Maak `GET /api/admin/users` met filter op rol, zoeken op naam of e-mail, en pagina's. Beveilig het met `requireRole('ADMIN')`.
*Klaar als:* alleen een beheerder de lijst krijgt, en filters en zoeken de juiste resultaten geven.

**[Frontend] Pagina "Gebruikers"**
Bouw de gebruikerstabel met rolfilters, zoekveld en de knoppen Vorige/Volgende. Op een klein scherm kun je de tabel horizontaal scrollen.
*Klaar als:* de pagina echte data toont en goed werkt op een laptopscherm.

---

## 11. Docentaccount aanmaken

Als beheerder
wil ik een account voor een docent kunnen aanmaken,
zodat alleen echte docenten quizzen kunnen maken en hosten.

**PRIORITEIT:** Must

**ACCEPTATIECRITERIA:**
- De beheerder kan een docentaccount aanmaken met naam en e-mailadres.
- De nieuwe docent krijgt een manier om zelf een wachtwoord in te stellen.
- Een speler kan zichzelf niet registreren als docent of beheerder.
- De beheerder kan de rol van een bestaande gebruiker wijzigen.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Rollen worden op de server gecontroleerd, niet alleen in de interface.
- De beheerder kan zijn eigen beheerdersrol niet per ongeluk weghalen.
- De interface past bij de rest van het admin-portaal.

### Taken

**[Backend] Docent aanmaken en rol wijzigen**
Maak `POST /api/admin/users` (docent met een uitnodigingslink om zelf een wachtwoord te kiezen) en `PATCH /api/admin/users/:id/role`. De beheerder kan zijn eigen beheerdersrol niet weghalen. Bij registratie is de rol altijd "student".
*Klaar als:* een docent zijn account kan activeren, en de rolcontroles op de server werken.

**[Frontend] "Docent toevoegen" en rol wijzigen**
Bouw het formulier "Docent toevoegen" en een manier om de rol van een gebruiker te wijzigen.
*Klaar als:* een beheerder een docent kan toevoegen en de nieuwe rol direct in de lijst ziet.

---

## 12. Gebruiker aanpassen of verwijderen

Als beheerder
wil ik gegevens van een gebruiker kunnen aanpassen of het account verwijderen,
zodat fouten en oude accounts opgeruimd kunnen worden.

**PRIORITEIT:** Could

**ACCEPTATIECRITERIA:**
- De beheerder kan de naam en het e-mailadres van een gebruiker aanpassen.
- De beheerder kan een account verwijderen na een bevestiging.
- Na het verwijderen is de gebruiker niet meer zichtbaar in het overzicht.

**KWALITEITSCRITERIA (wanneer is het goed volgens een professional):**
- Verwijderen is niet per ongeluk te doen.
- Uitslagen van rondes blijven kloppen na het verwijderen van een speler.
- De beheerder krijgt duidelijke feedback na elke actie.

### Taken

**[Backend] Gebruiker aanpassen of verwijderen**
Maak `PATCH /api/admin/users/:id` en `DELETE /api/admin/users/:id`. Gebruik dezelfde verwijderlogica als bij story 6, zodat de uitslagen blijven kloppen.
*Klaar als:* een beheerder gebruikers kan aanpassen en verwijderen.

**[Frontend] Bewerkvenster en bevestiging**
Koppel de bewerk- en verwijderknoppen in de tabel aan een bewerkvenster en een bevestigingsstap. Toon een melding na elke actie.
*Klaar als:* aanpassen en verwijderen werken vanuit de tabel.
