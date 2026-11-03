// De vragenbank voor een willekeurige quiz. Uit deze lijst kiest questionSelector.js de vragen,
// op basis van de vaardigheden van de spelers in de lobby.
//
// skill: één van de codes uit src/utils/skills.js (SD, AI, TI, CSC, GD, BI). Precies zo gespeld, met hoofdletters.
// difficulty: het niveau, 1 (makkelijk) t/m 5 (moeilijk), net als de sliders van de spelers (0 t/m 5).
//   Een hoger niveau geeft meer punten (zie src/utils/scoring.js).
//
// Let op bij het schrijven: maak het goede antwoord NIET steeds het langste (of het kortste).
// Spelers hebben dat snel door en gokken dan zonder na te denken. De test "de vragenbank" controleert dit.
//
// Een vraag toevoegen? Zet hem bij de goede vaardigheid en draai `npm test`:
// de test "de vragenbank" controleert of alles klopt.
export const QUESTION_BANK = [
  // ---------- SD: software development ----------
  bankQuestion("SD", 1, "Welke van deze talen draait standaard in de browser?", [
    ["Python"],
    ["JavaScript", true],
    ["Objective-C"],
    ["Visual Basic"],
  ]),
  bankQuestion("SD", 1, "Wat doet git commit?", [
    ["Je code naar GitHub uploaden"],
    ["Een nieuwe branch aanmaken"],
    ["Wijzigingen lokaal vastleggen", true],
    ["Twee branches samenvoegen tot één"],
  ]),
  bankQuestion("SD", 2, "Wat geeft [1, 2, 3].map((x) => x * 2) in JavaScript?", [
    ["[2, 4, 6]", true],
    ["12"],
    ["[1, 2, 3, 1, 2, 3]"],
    ["6"],
  ]),
  bankQuestion("SD", 2, "Welke HTTP-methode gebruik je meestal om iets nieuws aan te maken in een REST-API?", [
    ["GET"],
    ["DELETE"],
    ["HEAD"],
    ["POST", true],
  ]),
  bankQuestion("SD", 3, "Hoe snel is binair zoeken in een gesorteerde lijst (tijdscomplexiteit)?", [
    ["O(1)"],
    ["O(log n)", true],
    ["O(n log n)"],
    ["O(n²)"],
  ]),
  bankQuestion("SD", 3, "Waar staat de \"S\" voor in de SOLID-principes?", [
    ["Static type checking"],
    ["Secure by default"],
    ["Single responsibility", true],
    ["Separation of concerns"],
  ]),
  bankQuestion("SD", 4, "Wat is het verschil tussen == en === in JavaScript?", [
    ["== is sneller omdat het minder controleert"],
    ["== werkt alleen bij getallen, === bij alle types"],
    ["Er is geen verschil, het is een stijlkeuze"],
    ["=== vergelijkt ook het type, == zet eerst om", true],
  ]),
  bankQuestion("SD", 4, "Welk ontwerppatroon zorgt dat er van een klasse maar één object bestaat?", [
    ["Observer"],
    ["Factory method"],
    ["Singleton", true],
    ["Decorator"],
  ]),
  bankQuestion("SD", 5, "Wat is een race condition?", [
    ["Een lus die nooit stopt omdat de voorwaarde altijd waar blijft"],
    ["Twee threads die eeuwig op elkaar wachten om een lock vrij te geven"],
    ["Code die trager draait op een processor met meer kernen dan nodig is"],
    ["De uitkomst hangt af van welke thread het eerst bij gedeelde data is", true],
  ]),
  bankQuestion("SD", 5, "Hoe snel groeit het aantal deelverzamelingen van een lijst met n elementen?", [
    ["O(2ⁿ)", true],
    ["O(n²)"],
    ["O(n log n)"],
    ["O(n)"],
  ]),

  // ---------- AI: artificial intelligence ----------
  bankQuestion("AI", 1, "Waar staat de afkorting AI voor?", [
    ["Automatische Informatieverwerking"],
    ["Artificial Intelligence", true],
    ["Advanced Internet"],
    ["Analoge Informatica"],
  ]),
  bankQuestion("AI", 1, "Waar leert een machine-learningmodel van?", [
    ["Van voorbeelden (data)", true],
    ["Van een snellere processor"],
    ["Van een groter beeldscherm"],
    ["Van de handleiding"],
  ]),
  bankQuestion("AI", 2, "Hoe heet leren met voorbeelden waarvan het goede antwoord (label) al bekend is?", [
    ["Unsupervised learning"],
    ["Reinforcement learning"],
    ["Supervised learning", true],
    ["Deep linking"],
  ]),
  bankQuestion("AI", 2, "Wat betekent overfitting?", [
    ["Het model is te groot voor het werkgeheugen"],
    ["Het model leert de trainingsdata uit het hoofd", true],
    ["Het model traint te snel en slaat stappen over"],
    ["Het model heeft te weinig data gezien om te leren"],
  ]),
  bankQuestion("AI", 3, "Waarvoor gebruik je een validatieset bij het trainen van een model?", [
    ["Om het model sneller te laten trainen"],
    ["Om de trainingsdata kunstmatig groter te maken"],
    ["Om het getrainde model op schijf op te slaan"],
    ["Om instellingen te testen op ongeziene data", true],
  ]),
  bankQuestion("AI", 3, "Welke activatiefunctie berekent max(0, x)?", [
    ["Sigmoid"],
    ["ReLU", true],
    ["Softmax"],
    ["Tanh"],
  ]),
  bankQuestion("AI", 4, "Wat bepaalt de learning rate bij gradient descent?", [
    ["Hoeveel lagen het neurale netwerk heeft"],
    ["Hoeveel voorbeelden er in de dataset zitten"],
    ["Hoe vaak het model de testset mag zien"],
    ["Hoe groot de stap is bij elke aanpassing", true],
  ]),
  bankQuestion("AI", 4, "Welke maat zegt het meest bij een dataset met heel weinig positieve gevallen?", [
    ["Accuracy"],
    ["Precision en recall", true],
    ["Gemiddelde kwadratische fout"],
    ["Aantal epochs"],
  ]),
  bankQuestion("AI", 5, "Wat is het doel van het attention-mechanisme in een transformer?", [
    ["Het model sneller laten trainen door minder lagen te gebruiken"],
    ["De gewichten van het netwerk na elke trainingsronde opnieuw instellen"],
    ["Bepalen welke delen van de invoer belangrijk zijn voor elk woord", true],
    ["Voorkomen dat het model teksten langer dan één zin leest"],
  ]),
  bankQuestion("AI", 5, "Wat is het vanishing gradient-probleem?", [
    ["De trainingsdata raakt kwijt tijdens het trainen van het model"],
    ["Het model vergeet oude kennis zodra het iets nieuws leert"],
    ["De loss wordt negatief waardoor het trainen stopt"],
    ["Vroege lagen leren nauwelijks door piepkleine gradiënten", true],
  ]),

  // ---------- TI: technische informatica ----------
  bankQuestion("TI", 1, "Hoeveel bits zitten er in één byte?", [
    ["4"],
    ["8", true],
    ["16"],
    ["32"],
  ]),
  bankQuestion("TI", 1, "Welk onderdeel van een computer voert de berekeningen uit?", [
    ["De voeding"],
    ["De harde schijf"],
    ["De CPU", true],
    ["De ventilator"],
  ]),
  bankQuestion("TI", 2, "Wat is het binaire getal 1010 in het tientallige stelsel?", [
    ["8"],
    ["10", true],
    ["12"],
    ["20"],
  ]),
  bankQuestion("TI", 2, "Wat doet een pull-up-weerstand bij een knop op een microcontroller?", [
    ["De ingang hoog houden als de knop los is", true],
    ["De knop sneller laten reageren op een druk"],
    ["De spanning verhogen van 5 naar 12 volt"],
    ["De stroom door de knop meten en tonen"],
  ]),
  bankQuestion("TI", 3, "Hoeveel verschillende waarden kun je opslaan in 10 bits?", [
    ["100"],
    ["512"],
    ["2048"],
    ["1024", true],
  ]),
  bankQuestion("TI", 3, "Wat is het hexadecimale getal 0xFF in het tientallige stelsel?", [
    ["15"],
    ["255", true],
    ["256"],
    ["1600"],
  ]),
  bankQuestion("TI", 4, "Wat doet een interrupt bij een microcontroller?", [
    ["De microcontroller volledig uitzetten om stroom te sparen"],
    ["Het programma opnieuw opstarten na een fout"],
    ["Een pin omschakelen van ingang naar uitgang"],
    ["Direct reageren op een gebeurtenis, buiten de lus om", true],
  ]),
  bankQuestion("TI", 4, "Welk protocol gebruikt maar twee draden (SDA en SCL)?", [
    ["I²C", true],
    ["SPI"],
    ["UART"],
    ["USB"],
  ]),
  bankQuestion("TI", 5, "Waarom gebruiken computers two's complement voor negatieve getallen?", [
    ["Negatieve getallen nemen dan maar de helft van het geheugen in"],
    ["Het is de enige manier om een min-teken op te slaan"],
    ["Optellen en aftrekken werken dan met dezelfde schakeling", true],
    ["Getallen worden dan vanzelf afgerond op hele waarden"],
  ]),
  bankQuestion("TI", 5, "Wat zegt het Nyquist-criterium over het samplen van een signaal?", [
    ["Sample minstens twee keer zo snel als de hoogste frequentie", true],
    ["Sample precies even snel als de laagste frequentie"],
    ["Gebruik altijd minstens 16 bits per sample voor goede kwaliteit"],
    ["Filter het signaal pas na het samplen, nooit ervoor"],
  ]),

  // ---------- CSC: cyber security en cloud ----------
  bankQuestion("CSC", 1, "Wat is phishing?", [
    ["Een soort firewall voor je thuisnetwerk"],
    ["Een programmeertaal voor beveiliging"],
    ["Nepberichten om gegevens te stelen", true],
    ["Een methode om back-ups te maken"],
  ]),
  bankQuestion("CSC", 1, "Welk wachtwoord is het veiligst?", [
    ["Je geboortedatum met een uitroepteken"],
    ["Een lange, unieke zin", true],
    ["Hetzelfde sterke wachtwoord voor alles"],
    ["Je naam met een paar cijfers erachter"],
  ]),
  bankQuestion("CSC", 2, "Waar staat de S in HTTPS voor?", [
    ["Speed"],
    ["Server"],
    ["Simple"],
    ["Secure", true],
  ]),
  bankQuestion("CSC", 2, "Wat is tweestapsverificatie (2FA)?", [
    ["Iets wat je weet én iets wat je hebt", true],
    ["Twee keer je wachtwoord intypen bij het inloggen"],
    ["Op twee apparaten tegelijk ingelogd zijn"],
    ["Een wachtwoord dat uit twee woorden bestaat"],
  ]),
  bankQuestion("CSC", 3, "Waarom sla je wachtwoorden op als hash (bijv. bcrypt) en niet als gewone tekst?", [
    ["Een hash neemt minder opslagruimte in"],
    ["Dan kan de gebruiker inloggen zonder wachtwoord"],
    ["Bij een datalek zijn ze niet zomaar te lezen", true],
    ["Dan kun je het wachtwoord later terugmailen"],
  ]),
  bankQuestion("CSC", 3, "Wat is SQL-injectie?", [
    ["Een snelle manier om een database te vullen"],
    ["Invoer die als SQL-code wordt uitgevoerd", true],
    ["Een back-up van de database terugzetten"],
    ["Een index toevoegen aan een grote tabel"],
  ]),
  bankQuestion("CSC", 4, "Wat is het verschil tussen symmetrische en asymmetrische encryptie?", [
    ["Asymmetrisch gebruikt een publieke en een privésleutel", true],
    ["Symmetrisch werkt alleen op bestanden, niet op berichten"],
    ["Asymmetrisch is altijd sneller dan symmetrisch versleutelen"],
    ["Symmetrisch gebruikt geen sleutel maar een wachtwoord"],
  ]),
  bankQuestion("CSC", 4, "Wat betekent het principe \"least privilege\"?", [
    ["Alleen de beheerder mag inloggen op de servers"],
    ["Gebruikers met de minste rechten worden als eerste geholpen"],
    ["Wachtwoorden hoeven minder vaak te worden veranderd"],
    ["Iedereen krijgt alleen de rechten die nodig zijn", true],
  ]),
  bankQuestion("CSC", 5, "Wat is een XSS-aanval (cross-site scripting)?", [
    ["Een aanvaller laat zijn script draaien in de browser van een ander", true],
    ["Een aanvaller stuurt zoveel verzoeken dat de server plat gaat"],
    ["Een aanvaller luistert het wifi-verkeer af in een openbaar netwerk"],
    ["Een aanvaller raadt wachtwoorden door alle mogelijke combinaties te proberen"],
  ]),
  bankQuestion("CSC", 5, "Waarvoor dient een salt bij het hashen van wachtwoorden?", [
    ["De hash wordt korter en past beter in de database"],
    ["Het wachtwoord is daarna terug te rekenen voor de beheerder"],
    ["Gelijke wachtwoorden krijgen zo een verschillende hash", true],
    ["De server hoeft het wachtwoord niet meer te controleren"],
  ]),

  // ---------- GD: game development ----------
  bankQuestion("GD", 1, "Waar staat FPS voor bij een game?", [
    ["Frames per second", true],
    ["Files per server"],
    ["Fast player speed"],
    ["Free points system"],
  ]),
  bankQuestion("GD", 1, "Wat is een sprite in een 2D-game?", [
    ["Een geluidseffect bij een sprong"],
    ["Een plaatje dat in de game beweegt", true],
    ["Een moeilijk level aan het einde"],
    ["Een opgeslagen spel op je spelcomputer"],
  ]),
  bankQuestion("GD", 2, "Waarom vermenigvuldig je een beweging met deltaTime?", [
    ["Minder werkgeheugen gebruiken per frame"],
    ["De graphics scherper laten lijken"],
    ["Snelheid los van de framerate houden", true],
    ["Geluid en beeld gelijk laten lopen"],
  ]),
  bankQuestion("GD", 2, "Wat is een hitbox?", [
    ["Een kist met power-ups in een level"],
    ["Het pauzemenu van een game"],
    ["Een grafische kaart voor snellere games"],
    ["Een onzichtbare vorm voor botsingen", true],
  ]),
  bankQuestion("GD", 3, "Waarvoor gebruikt een 3D-engine meestal een quaternion?", [
    ["Een rotatie zonder gimbal lock", true],
    ["Een kleur met transparantie erbij"],
    ["Een geluid in 3D laten klinken"],
    ["Een texture kleiner opslaan"],
  ]),
  bankQuestion("GD", 3, "Wat is culling in game-graphics?", [
    ["Alle objecten twee keer tekenen voor scherpte"],
    ["Objecten die je niet ziet niet tekenen", true],
    ["Textures groter maken voor meer detail"],
    ["De framerate vastzetten op zestig"],
  ]),
  bankQuestion("GD", 4, "Waarvoor gebruik je een state machine in een game?", [
    ["De voortgang van de speler op de harde schijf bewaren"],
    ["Licht en schaduw in een 3D-scène zo realistisch mogelijk berekenen"],
    ["Berichten tussen spelers in een online game versturen"],
    ["De toestand van een figuur bijhouden (lopen, springen)", true],
  ]),
  bankQuestion("GD", 4, "Wat doet het A*-algoritme (A-star) in een game?", [
    ["De kortste route zoeken naar een doel", true],
    ["Sterren en lichtpunten in de lucht tekenen"],
    ["De moeilijkheid aanpassen aan hoe goed je speelt"],
    ["Objecten zo snel mogelijk laten vallen door zwaartekracht"],
  ]),
  bankQuestion("GD", 5, "Waarom is een vaste tijdstap (fixed timestep) handig voor game-physics?", [
    ["De game gebruikt dan geen grafische kaart meer"],
    ["Botsingen worden dan door de grafische kaart berekend"],
    ["De physics gedragen zich dan hetzelfde op elke computer", true],
    ["De framerate wordt dan automatisch verdubbeld op snelle pc's"],
  ]),
  bankQuestion("GD", 5, "Wat is een normal map?", [
    ["Een overzichtskaart van het level die de speler kan openen"],
    ["Een lijst met de standaardinstellingen van de game"],
    ["Een texture die de kleur van een object bepaalt"],
    ["Een texture die reliëf nabootst via het licht", true],
  ]),

  // ---------- BI: business en IT ----------
  bankQuestion("BI", 1, "Wat is een database?", [
    ["Een soort beeldscherm voor cijfers"],
    ["Een programmeertaal voor websites"],
    ["Een verzameling geordende gegevens", true],
    ["Een netwerkkabel tussen servers"],
  ]),
  bankQuestion("BI", 1, "Waar staat de afkorting KPI voor?", [
    ["Key Performance Indicator", true],
    ["Klant Product Index"],
    ["Key Program Interface"],
    ["Kwaliteit Per Individueel Product"],
  ]),
  bankQuestion("BI", 2, "Welke SQL-opdracht haalt rijen op uit een tabel?", [
    ["GET"],
    ["SELECT", true],
    ["RETRIEVE"],
    ["PULL"],
  ]),
  bankQuestion("BI", 2, "Wat is een stakeholder in een IT-project?", [
    ["De server waarop het project draait"],
    ["Iemand met belang bij het project", true],
    ["Het eerste deel van de broncode"],
    ["Een script dat de tests uitvoert"],
  ]),
  bankQuestion("BI", 3, "Wat doet GROUP BY in SQL?", [
    ["Rijen samennemen per waarde, om per groep te tellen", true],
    ["Rijen sorteren van hoog naar laag op een kolom"],
    ["Een tabel en al zijn gegevens verwijderen"],
    ["Twee databases met elkaar koppelen via een gedeelde sleutel"],
  ]),
  bankQuestion("BI", 3, "Wat is het doel van een database normaliseren?", [
    ["De database sneller laten opstarten"],
    ["Dubbele gegevens voorkomen", true],
    ["Alle tabellen samenvoegen tot één tabel"],
    ["De gegevens versleutelen tegen hackers"],
  ]),
  bankQuestion("BI", 4, "Wat is het verschil tussen een primary key en een foreign key?", [
    ["Een primary key mag leeg zijn, een foreign key nooit"],
    ["Een foreign key is altijd een tekst en een primary key altijd een getal"],
    ["Een foreign key verwijst naar de primary key van een andere tabel", true],
    ["Er is geen verschil, alleen de naam is anders"],
  ]),
  bankQuestion("BI", 4, "Waarvoor gebruik je een BPMN-diagram?", [
    ["De tabellen van een database ontwerpen"],
    ["De kosten van een project per maand berekenen"],
    ["De schermen van een app vormgeven"],
    ["Een bedrijfsproces stap voor stap tekenen", true],
  ]),
  bankQuestion("BI", 5, "Waar staat de I van ACID bij databasetransacties voor?", [
    ["Isolation", true],
    ["Integrity"],
    ["Indexing"],
    ["Immutability"],
  ]),
  bankQuestion("BI", 5, "Wat is het verschil tussen OLTP en OLAP?", [
    ["OLTP draait in de cloud, OLAP alleen lokaal"],
    ["OLAP is de nieuwere versie van OLTP"],
    ["OLTP is voor transacties, OLAP voor analyses", true],
    ["OLTP slaat tekst op, OLAP alleen getallen en datums"],
  ]),
];

// Korte schrijfwijze, net als in quizQuestions.js: [tekst, true] is het goede antwoord.
// De ids tellen per vraag vanaf 1: de schermen koppelen daar de kleuren en vormen aan.
function bankQuestion(skill, difficulty, text, options, timeLimitSec = 20) {
  return {
    skill,
    difficulty,
    text,
    timeLimitSec,
    options: options.map(([optionText, isCorrect = false], i) => ({
      id: i + 1,
      text: optionText,
      isCorrect,
    })),
  };
}
