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
  bankQuestion(
    "SD",
    1,
    "Welke van deze talen draait standaard in de browser?",
    [["Python"], ["JavaScript", true], ["Objective-C"], ["Visual Basic"]],
  ),
  bankQuestion("SD", 1, "Wat doet git commit?", [
    ["Je code naar GitHub uploaden"],
    ["Een nieuwe branch aanmaken"],
    ["Wijzigingen lokaal vastleggen", true],
    ["Twee branches samenvoegen tot één"],
  ]),
  bankQuestion(
    "SD",
    1,
    "Welke HTML-tag gebruik je voor het belangrijkste kopje van een webpagina?",
    [["<head>"], ["<h1>", true], ["<header>"], ["<heading>"]],
  ),
  bankQuestion("SD", 1, "Waar staat de afkorting CSS voor?", [
    ["Cascading Style Sheets", true],
    ["Creative Style System"],
    ["Computer Style Sheets"],
    ["Colorful Style System"],
  ]),
  bankQuestion(
    "SD",
    2,
    "Wat geeft [1, 2, 3].map((x) => x * 2) in JavaScript?",
    [["[2, 4, 6]", true], ["12"], ["[1, 2, 3, 1, 2, 3]"], ["6"]],
  ),
  bankQuestion(
    "SD",
    2,
    "Welke HTTP-methode gebruik je meestal om iets nieuws aan te maken in een REST-API?",
    [["GET"], ["DELETE"], ["HEAD"], ["POST", true]],
  ),
  bankQuestion(
    "SD",
    2,
    "Welke CSS-eenheid is altijd relatief aan de font-size van het root-element (html)?",
    [["em"], ["vh"], ["rem", true], ["%"]],
  ),
  bankQuestion(
    "SD",
    2,
    "Welke CSS-property gebruik je om de ruimte tussen de rand en de inhoud van een element te bepalen?",
    [["margin"], ["padding", true], ["border"], ["spacing"]],
  ),
  bankQuestion(
    "SD",
    3,
    "Hoe snel is binair zoeken in een gesorteerde lijst (tijdscomplexiteit)?",
    [["O(1)"], ["O(log n)", true], ["O(n log n)"], ["O(n²)"]],
  ),
  bankQuestion("SD", 3, 'Waar staat de "S" voor in de SOLID-principes?', [
    ["Static type checking"],
    ["Secure by default"],
    ["Single responsibility", true],
    ["Separation of concerns"],
  ]),
  bankQuestion(
    "SD",
    3,
    "Welke JavaScript-methode voegt één of meer elementen toe aan het einde van een array?",
    [[".shift()"], [".push()", true], [".unshift()"], [".pop()"]],
  ),
  bankQuestion(
    "SD",
    3,
    "Welk trefwoord gebruik je in JavaScript om een variabele te declareren die niet opnieuw toegewezen kan worden?",
    [["var"], ["let"], ["const", true], ["static"]],
  ),
  bankQuestion("SD", 4, "Wat is het verschil tussen == en === in JavaScript?", [
    ["== is sneller omdat het minder controleert"],
    ["== werkt alleen bij getallen, === bij alle types"],
    ["Er is geen verschil, het is een stijlkeuze"],
    ["=== vergelijkt ook het type, == zet eerst om", true],
  ]),
  bankQuestion(
    "SD",
    4,
    "Welk ontwerppatroon zorgt dat er van een klasse maar één object bestaat?",
    [["Observer"], ["Factory method"], ["Singleton", true], ["Decorator"]],
  ),
  bankQuestion("SD", 4, "Wat is een closure in JavaScript?", [
    ["Een methode om een lus direct te beëindigen"],
    ["Een beveiligingsmechanisme tegen XSS-aanvallen"],
    [
      "Een functie die toegang behoudt tot variabelen uit haar outer scope",
      true,
    ],
    ["Een automatische garbage collection actie"],
  ]),
  bankQuestion("SD", 4, "Wat is het hoofddoel van ARIA-attributen in HTML?", [
    ["De animatiesnelheid in CSS optimaliseren"],
    ["Standaard CSS-styling overschrijven"],
    ["Hogere vindbaarheid in zoekmachines garanderen"],
    ["Toegankelijkheid voor screenreaders verbeteren", true],
  ]),
  bankQuestion("SD", 5, "Wat is een race condition?", [
    ["Een lus die nooit stopt omdat de voorwaarde altijd waar blijft"],
    ["Twee threads die eeuwig op elkaar wachten om een lock vrij te geven"],
    ["Code die trager draait op een processor met meer kernen dan nodig is"],
    [
      "De uitkomst hangt af van welke thread het eerst bij gedeelde data is",
      true,
    ],
  ]),
  bankQuestion(
    "SD",
    5,
    "Hoe snel groeit het aantal deelverzamelingen van een lijst met n elementen?",
    [["O(2ⁿ)", true], ["O(n²)"], ["O(n log n)"], ["O(n)"]],
  ),
  bankQuestion(
    "SD",
    5,
    "Wat gebeurt er tijdens de Layout (reflow)-stap in de rendering pipeline van een browser?",
    [
      ["Het omzetten van netwerkbytes naar pixels"],
      [
        "Het berekenen van de exacte afmetingen en posities van elementen",
        true,
      ],
      ["Het uitvoeren van JavaScript event listeners"],
      ["Het comprimeren en cachen van bestanden"],
    ],
  ),
  bankQuestion(
    "SD",
    5,
    "Wat is het belangrijkste verschil tussen sessionStorage und localStorage?",
    [
      [
        "sessionStorage wordt gewist zodra het tabblad of de browser sluit",
        true,
      ],
      ["localStorage is versleuteld en sessionStorage niet"],
      ["sessionStorage heeft een limiet van 5 MB en localStorage niet"],
      ["Er is technisch geen verschil behalve de naam"],
    ],
  ),

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
  bankQuestion("AI", 1, "Wat is een chatbot?", [
    ["Een programma dat in gewone taal met je praat", true],
    ["Een virus dat zich via chatberichten verspreidt"],
    ["Een robot die in een fabriek werkt"],
    ["Een app om groepsgesprekken op te nemen"],
  ]),
  bankQuestion("AI", 1, "Welke van deze toepassingen gebruikt AI?", [
    ["Een rekenmachine die 2 + 2 optelt"],
    ["Een lichtschakelaar met timer"],
    ["Spraakherkenning op je telefoon", true],
    ["Een USB-stick die bestanden opslaat"],
  ]),
  bankQuestion(
    "AI",
    2,
    "Hoe heet leren met voorbeelden waarvan het goede antwoord (label) al bekend is?",
    [
      ["Unsupervised learning"],
      ["Reinforcement learning"],
      ["Supervised learning", true],
      ["Deep linking"],
    ],
  ),
  bankQuestion("AI", 2, "Wat betekent overfitting?", [
    ["Het model is te groot voor het werkgeheugen"],
    ["Het model leert de trainingsdata uit het hoofd", true],
    ["Het model traint te snel en slaat stappen over"],
    ["Het model heeft te weinig data gezien om te leren"],
  ]),
  bankQuestion("AI", 2, "Wat is een 'hallucinatie' bij een taalmodel?", [
    ["Het model weigert een vraag te beantwoorden"],
    ["Het model verzint feiten die niet kloppen", true],
    ["Het model crasht door te veel vragen tegelijk"],
    ["Het model geeft steeds hetzelfde antwoord"],
  ]),
  bankQuestion(
    "AI",
    2,
    "Welke taak is een voorbeeld van unsupervised learning?",
    [
      ["Spam herkennen met gelabelde e-mails"],
      ["Huisprijzen voorspellen uit oude verkopen"],
      ["Een robot leren lopen met beloningen"],
      ["Klanten in groepen indelen zonder labels", true],
    ],
  ),
  bankQuestion(
    "AI",
    3,
    "Waarvoor gebruik je een validatieset bij het trainen van een model?",
    [
      ["Om het model sneller te laten trainen"],
      ["Om de trainingsdata kunstmatig groter te maken"],
      ["Om het getrainde model op schijf op te slaan"],
      ["Om instellingen te testen op ongeziene data", true],
    ],
  ),
  bankQuestion("AI", 3, "Welke activatiefunctie berekent max(0, x)?", [
    ["Sigmoid"],
    ["ReLU", true],
    ["Softmax"],
    ["Tanh"],
  ]),
  bankQuestion(
    "AI",
    3,
    "Je wilt de temperatuur van morgen in graden voorspellen. Wat voor taak is dat?",
    [
      ["Een regressietaak", true],
      ["Een classificatietaak"],
      ["Een clusteringtaak"],
      ["Een rankingtaak"],
    ],
  ),
  bankQuestion("AI", 3, "Wat laat een confusion matrix zien?", [
    ["Hoe de trainingsdata per epoch gehusseld wordt"],
    ["Welke lagen het netwerk het meest vertragen"],
    ["Goede en foute voorspellingen per klasse", true],
    ["Hoe tekst wordt omgezet naar getallen"],
  ]),
  bankQuestion("AI", 4, "Wat bepaalt de learning rate bij gradient descent?", [
    ["Hoeveel lagen het neurale netwerk heeft"],
    ["Hoeveel voorbeelden er in de dataset zitten"],
    ["Hoe vaak het model de testset mag zien"],
    ["Hoe groot de stap is bij elke aanpassing", true],
  ]),
  bankQuestion(
    "AI",
    4,
    "Welke maat zegt het meest bij een dataset met heel weinig positieve gevallen?",
    [
      ["Accuracy"],
      ["Precision en recall", true],
      ["Gemiddelde kwadratische fout"],
      ["Aantal epochs"],
    ],
  ),
  bankQuestion("AI", 4, "Waarvoor dient dropout in een neuraal netwerk?", [
    ["Trage lagen verwijderen zodat het model sneller traint"],
    ["Ontbrekende waarden in de dataset opvullen"],
    ["De learning rate verlagen na elke epoch"],
    ["Overfitting tegengaan door neuronen uit te zetten", true],
  ]),
  bankQuestion(
    "AI",
    4,
    "Wat gebeurt er als je de temperature van een taalmodel verhoogt?",
    [
      ["Het model rekent sneller op de GPU"],
      ["De antwoorden worden willekeuriger", true],
      ["Het model onthoudt een langer gesprek"],
      ["Het model leert van jouw vragen"],
    ],
  ),
  bankQuestion(
    "AI",
    5,
    "Wat is het doel van het attention-mechanisme in een transformer?",
    [
      ["Het model sneller laten trainen door minder lagen te gebruiken"],
      ["De gewichten van het netwerk na elke trainingsronde opnieuw instellen"],
      [
        "Bepalen welke delen van de invoer belangrijk zijn voor elk woord",
        true,
      ],
      ["Voorkomen dat het model teksten langer dan één zin leest"],
    ],
  ),
  bankQuestion("AI", 5, "Wat is het vanishing gradient-probleem?", [
    ["De trainingsdata raakt kwijt tijdens het trainen van het model"],
    ["Het model vergeet oude kennis zodra het iets nieuws leert"],
    ["De loss wordt negatief waardoor het trainen stopt"],
    ["Vroege lagen leren nauwelijks door piepkleine gradiënten", true],
  ]),
  bankQuestion("AI", 5, "Wat doet Retrieval-Augmented Generation (RAG)?", [
    ["Het model opnieuw trainen bij elke nieuwe vraag"],
    ["Antwoorden van meerdere modellen samenvoegen"],
    ["Relevante documenten ophalen en in de prompt meegeven", true],
    ["De gewichten comprimeren zodat het model kleiner wordt"],
  ]),
  bankQuestion(
    "AI",
    5,
    "De embeddings van twee woorden hebben een hoge cosine similarity. Wat betekent dat?",
    [
      ["Ze hebben een vergelijkbare betekenis", true],
      ["Ze hebben evenveel letters"],
      ["Ze komen even vaak voor in de trainingsdata"],
      ["Ze staan in de zin direct naast elkaar"],
    ],
  ),

  // ---------- TI: technische informatica ----------
  bankQuestion("TI", 1, "Hoeveel bits zitten er in één byte?", [
    ["4"],
    ["8", true],
    ["16"],
    ["32"],
  ]),
  bankQuestion(
    "TI",
    1,
    "Welk onderdeel van een computer voert de berekeningen uit?",
    [["De voeding"], ["De harde schijf"], ["De CPU", true], ["De ventilator"]],
  ),
  bankQuestion("TI", 1, "Wat is geen programmeertaal voor embedded systems?", [
    ["Assembly"],
    ["Python"],
    ["React", true],
    ["Rust"],
  ]),
  bankQuestion("TI", 1, "Wat is een Breadboard?", [
    ["Bord met brood"],
    ["Kunststof bordje voor elektronische schakeling", true],
    ["Een batterij voor stroomkring"],
    ["Een plannings bord met punaises"],
  ]),
  bankQuestion(
    "TI",
    2,
    "Wat is het binaire getal 1010 in het tientallige stelsel?",
    [["8"], ["10", true], ["12"], ["20"]],
  ),
  bankQuestion(
    "TI",
    2,
    "Wat doet een pull-up-weerstand bij een knop op een microcontroller?",
    [
      ["De ingang hoog houden als de knop los is", true],
      ["De knop sneller laten reageren op een druk"],
      ["De spanning verhogen van 5 naar 12 volt"],
      ["De stroom door de knop meten en tonen"],
    ],
  ),
  bankQuestion("TI", 2, "Wat is geen type wire", [
    ["Male - Male"],
    ["Male - Female"],
    ["Male - Mail", true],
    ["Female - Female"],
  ]),
  bankQuestion("TI", 2, "Wat doet soldering?", [
    ["Metaal smelten om electronica te koppelen", true],
    ["Het leger in gaan"],
    ["Code debuggen"],
    ["Metalen platen samen lassen"],
  ]),
  bankQuestion(
    "TI",
    3,
    "Hoeveel verschillende waarden kun je opslaan in 10 bits?",
    [["100"], ["512"], ["2048"], ["1024", true]],
  ),
  bankQuestion(
    "TI",
    3,
    "Wat is het hexadecimale getal 0xFF in het tientallige stelsel?",
    [["15"], ["255", true], ["256"], ["1600"]],
  ),
  bankQuestion("TI", 3, "Wat is geen test apparaat?", [
    ["Multimeter"],
    ["Rework", true],
    ["Logic"],
    ["Oscilloscope"],
  ]),
  bankQuestion("TI", 3, "Waar staat de P voor in PWM?", [
    ["Pulse", true],
    ["Plus"],
    ["Plastic"],
    ["Power"],
  ]),
  bankQuestion("TI", 4, "Wat doet een interrupt bij een microcontroller?", [
    ["De microcontroller volledig uitzetten om stroom te sparen"],
    ["Het programma opnieuw opstarten na een fout"],
    ["Een pin omschakelen van ingang naar uitgang"],
    ["Direct reageren op een gebeurtenis, buiten de lus om", true],
  ]),
  bankQuestion(
    "TI",
    4,
    "Welk protocol gebruikt maar twee draden (SDA en SCL)?",
    [["I²C", true], ["SPI"], ["UART"], ["USB"]],
  ),
  bankQuestion(
    "TI",
    4,
    "Wat wordt NIET gebruikt om embedded system software te debuggen?",
    [["jTAG / SWD"], ["GDB"], ["OpenOCD"], ["IPC", true]],
  ),
  bankQuestion(
    "TI",
    4,
    "Wat is de stroomsterkte als je 3x 1,2Ah batterijen in serie zet?",
    [["1,2Ah", true], ["3,6Ha"], ["3,6Ah"], ["1,2aH"]],
  ),
  bankQuestion(
    "TI",
    5,
    "Waarom gebruiken computers two's complement voor negatieve getallen?",
    [
      ["Negatieve getallen nemen dan maar de helft van het geheugen in"],
      ["Het is de enige manier om een min-teken op te slaan"],
      ["Optellen en aftrekken werken dan met dezelfde schakeling", true],
      ["Getallen worden dan vanzelf afgerond op hele waarden"],
    ],
  ),
  bankQuestion(
    "TI",
    5,
    "Wat zegt het Nyquist-criterium over het samplen van een signaal?",
    [
      ["Sample minstens twee keer zo snel als de hoogste frequentie", true],
      ["Sample precies even snel als de laagste frequentie"],
      ["Gebruik altijd minstens 16 bits per sample voor goede kwaliteit"],
      ["Filter het signaal pas na het samplen, nooit ervoor"],
    ],
  ),
  bankQuestion("TI", 5, "Wat is een ISR (Interrupt Service Routine)?", [
    [
      "Het onderbreekt het hoofdprogramma om een hardware gebeurtenis te handelen",
      true,
    ],
    ["Het stopt het apparaat voor een dagelijkse restart"],
    ["Het is een manier om hardware te hacken"],
    ["TI slang voor het wachten tot de apparatuur is opgestart"],
  ]),
  bankQuestion("TI", 5, "Waar staat volatile voor in embedded code?", [
    ["Dat is de waarde van een variable buiten een range kan gaan", true],
    ["Het is een ander woord voor Important"],
    ["Het doet niks"],
    ["Het veranderd de uitgaande voltage voor de apparaat onderdelen"],
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
  bankQuestion("CSC", 1, "Wat is phishing?", [
    ["Malware die je bestanden versleutelt en losgeld vraagt"],
    ["Een aanval die een website platlegt met enorm veel verkeer"],
    [
      "Een nepbericht dat je probeert te verleiden om gegevens af te geven",
      true,
    ],
    ["Software die stiekem je toetsaanslagen registreert"],
  ]),
  bankQuestion("CSC", 1, "Welk wachtwoord is het sterkst?", [
    ["Welkom123"],
    ["P@ssw0rd"],
    ["Jan1990!"],
    ["fiets-Lamp-Regen-42!", true],
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
  bankQuestion("CSC", 2, "Waar staat de S in HTTPS voor?", [
    ["Secure", true],
    ["Server"],
    ["Standard"],
    ["System"],
  ]),
  bankQuestion("CSC", 2, "Wat doet tweestapsverificatie (2FA)?", [
    ["Het wachtwoord twee keer laten invoeren bij het inloggen"],
    [
      "Naast je wachtwoord een tweede, los bewijs van je identiteit vragen",
      true,
    ],
    ["Je automatisch uitloggen na een periode van inactiviteit"],
    ["Je verplichten je wachtwoord regelmatig te wijzigen"],
  ]),
  bankQuestion(
    "CSC",
    3,
    "Waarom sla je wachtwoorden op als hash (bijv. bcrypt) en niet als gewone tekst?",
    [
      ["Een hash neemt minder opslagruimte in"],
      ["Dan kan de gebruiker inloggen zonder wachtwoord"],
      ["Bij een datalek zijn ze niet zomaar te lezen", true],
      ["Dan kun je het wachtwoord later terugmailen"],
    ],
  ),
  bankQuestion("CSC", 3, "Wat is SQL-injectie?", [
    ["Een snelle manier om een database te vullen"],
    ["Invoer die als SQL-code wordt uitgevoerd", true],
    ["Een back-up van de database terugzetten"],
    ["Een index toevoegen aan een grote tabel"],
  ]),
  bankQuestion(
    "CSC",
    3,
    "Waar staat de CIA-triad in informatiebeveiliging voor?",
    [
      ["Control, Identity, Access"],
      ["Cyber, Intelligence, Authentication"],
      ["Confidentiality, Identification, Authorization"],
      ["Confidentiality, Integrity, Availability", true],
    ],
  ),
  bankQuestion(
    "CSC",
    3,
    "Iemand vult ' OR '1'='1 in bij een loginveld. Welke aanval is dit?",
    [
      ["Cross-Site Scripting (XSS)"],
      ["SQL-injectie", true],
      ["Cross-Site Request Forgery (CSRF)"],
      ["Brute force"],
    ],
  ),
  bankQuestion(
    "CSC",
    4,
    "Wat is het verschil tussen symmetrische en asymmetrische encryptie?",
    [
      ["Asymmetrisch gebruikt een publieke en een privésleutel", true],
      ["Symmetrisch werkt alleen op bestanden, niet op berichten"],
      ["Asymmetrisch is altijd sneller dan symmetrisch versleutelen"],
      ["Symmetrisch gebruikt geen sleutel maar een wachtwoord"],
    ],
  ),
  bankQuestion("CSC", 4, 'Wat betekent het principe "least privilege"?', [
    ["Alleen de beheerder mag inloggen op de servers"],
    ["Gebruikers met de minste rechten worden als eerste geholpen"],
    ["Wachtwoorden hoeven minder vaak te worden veranderd"],
    ["Iedereen krijgt alleen de rechten die nodig zijn", true],
  ]),
  bankQuestion(
    "CSC",
    4,
    "Waarom voeg je een salt toe bij het hashen van wachtwoorden?",
    [
      ["Zodat het wachtwoord later weer te ontsleutelen is"],
      ["Om het hashen sneller en efficiënter te maken"],
      ["Zodat gelijke wachtwoorden verschillende hashes krijgen", true],
      ["Om de opgeslagen hash korter te maken"],
    ],
  ),
  bankQuestion(
    "CSC",
    4,
    "Je wilt Bob een vertrouwelijk bericht sturen met asymmetrische encryptie. Met welke sleutel versleutel je het?",
    [
      ["Bobs private sleutel"],
      ["Jouw private sleutel"],
      ["Bobs publieke sleutel", true],
      ["Jouw publieke sleutel"],
    ],
  ),
  bankQuestion("CSC", 5, "Wat is een XSS-aanval (cross-site scripting)?", [
    [
      "Een aanvaller laat zijn script draaien in de browser van een ander",
      true,
    ],
    ["Een aanvaller stuurt zoveel verzoeken dat de server plat gaat"],
    ["Een aanvaller luistert het wifi-verkeer af in een openbaar netwerk"],
    [
      "Een aanvaller raadt wachtwoorden door alle mogelijke combinaties te proberen",
    ],
  ]),
  bankQuestion(
    "CSC",
    5,
    "Waarvoor dient een salt bij het hashen van wachtwoorden?",
    [
      ["De hash wordt korter en past beter in de database"],
      ["Het wachtwoord is daarna terug te rekenen voor de beheerder"],
      ["Gelijke wachtwoorden krijgen zo een verschillende hash", true],
      ["De server hoeft het wachtwoord niet meer te controleren"],
    ],
  ),
  bankQuestion(
    "CSC",
    5,
    "Wat garandeert Perfect Forward Secrecy (bijv. ECDHE in TLS 1.3)?",
    [
      [
        "Lekt de private key later uit, dan blijven eerder opgenomen sessies veilig",
        true,
      ],
      ["Een certificaat kan niet worden vervalst"],
      [
        "Sessiesleutels kunnen veilig worden hergebruikt voor betere prestaties",
      ],
      ["De verbinding is beschermd tegen MITM, ook zonder certificaten"],
    ],
  ),
  bankQuestion(
    "CSC",
    5,
    "Welke beveiliging is Return-Oriented Programming (ROP) vooral bedoeld om te omzeilen?",
    [
      ["Stack canaries"],
      ["ASLR"],
      ["NX-bit / DEP (niet-uitvoerbaar geheugen)", true],
      ["Content Security Policy"],
    ],
  ),

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
  bankQuestion(
    "GD",
    2,
    "Waarom vermenigvuldig je een beweging met deltaTime?",
    [
      ["Minder werkgeheugen gebruiken per frame"],
      ["De graphics scherper laten lijken"],
      ["Snelheid los van de framerate houden", true],
      ["Geluid en beeld gelijk laten lopen"],
    ],
  ),
  bankQuestion("GD", 2, "Wat is een hitbox?", [
    ["Een kist met power-ups in een level"],
    ["Het pauzemenu van een game"],
    ["Een grafische kaart voor snellere games"],
    ["Een onzichtbare vorm voor botsingen", true],
  ]),
  bankQuestion(
    "GD",
    3,
    "Waarvoor gebruikt een 3D-engine meestal een quaternion?",
    [
      ["Een rotatie zonder gimbal lock", true],
      ["Een kleur met transparantie erbij"],
      ["Een geluid in 3D laten klinken"],
      ["Een texture kleiner opslaan"],
    ],
  ),
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
  bankQuestion(
    "GD",
    5,
    "Waarom is een vaste tijdstap (fixed timestep) handig voor game-physics?",
    [
      ["De game gebruikt dan geen grafische kaart meer"],
      ["Botsingen worden dan door de grafische kaart berekend"],
      ["De physics gedragen zich dan hetzelfde op elke computer", true],
      ["De framerate wordt dan automatisch verdubbeld op snelle pc's"],
    ],
  ),
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
  bankQuestion(
    "BI",
    1,
    "Wat is een typisch gevolg van slechte communicatie tussen IT en de business?",
    [
      ["De IT-kosten dalen omdat er minder overleg nodig is"],
      [
        "Er wordt software gebouwd die niet aansluit op de behoeften van de organisatie",
        true,
      ],
      ["Projecten worden sneller opgeleverd door minder afstemming"],
      ["De organisatie wordt minder afhankelijk van IT"],
    ],
  ),
  bankQuestion(
    "BI",
    1,
    "Een webshop valt uit tijdens een grote uitverkoop. Wat is het grootste directe risico?",
    [
      ["Een boete van de Autoriteit Persoonsgegevens"],
      ["Verlies van alle historische klantdata"],
      ["Hogere licentiekosten voor de webshopsoftware"],
      ["Direct omzetverlies en reputatieschade", true],
    ],
  ),
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
  bankQuestion(
    "BI",
    2,
    "Wat is het belangrijkste verschil tussen data en informatie?",
    [
      [
        "Data zijn losse feiten; informatie is data die in een context betekenis heeft gekregen",
        true,
      ],
      ["Data is altijd digitaal; informatie staat altijd op papier"],
      ["Data is openbaar; informatie is altijd vertrouwelijk"],
      ["Data is gestructureerd; informatie is ongestructureerd"],
    ],
  ),
  bankQuestion(
    "BI",
    2,
    "Wat is de hoofdtaak van een business analyst bij softwareontwikkeling?",
    [
      ["De applicatie programmeren en testen"],
      ["De IT-infrastructuur beheren en onderhouden"],
      ["Bedrijfsbehoeften vertalen naar functionele eisen", true],
      ["Het projectbudget vaststellen en bewaken"],
    ],
  ),
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
  bankQuestion(
    "BI",
    3,
    "Wat is een belangrijk voordeel van een standaard SaaS-oplossing ten opzichte van maatwerk?",
    [
      ["Volledige controle over de broncode"],
      ["Snellere implementatie en lagere opstartkosten", true],
      ["Onbeperkte mogelijkheden om functionaliteit aan te passen"],
      [
        "Een uniek concurrentievoordeel, omdat niemand anders dezelfde oplossing heeft",
      ],
    ],
  ),
  bankQuestion(
    "BI",
    3,
    "Wat is binnen change management de beste aanpak om gebruikers een nieuw IT-systeem te laten accepteren?",
    [
      ["Het nieuwe systeem in één keer invoeren en het oude direct uitzetten"],
      [
        "Een uitgebreide handleiding verspreiden en gebruikers het zelf laten uitzoeken",
      ],
      ["Alleen het management trainen en hen de rest laten informeren"],
      [
        "Gebruikers vroeg betrekken, trainen en de voordelen duidelijk maken",
        true,
      ],
    ],
  ),
  bankQuestion(
    "BI",
    4,
    "Wat is het verschil tussen een primary key en een foreign key?",
    [
      ["Een primary key mag leeg zijn, een foreign key nooit"],
      [
        "Een foreign key is altijd een tekst en een primary key altijd een getal",
      ],
      [
        "Een foreign key verwijst naar de primary key van een andere tabel",
        true,
      ],
      ["Er is geen verschil, alleen de naam is anders"],
    ],
  ),
  bankQuestion("BI", 4, "Waarvoor gebruik je een BPMN-diagram?", [
    ["De tabellen van een database ontwerpen"],
    ["De kosten van een project per maand berekenen"],
    ["De schermen van een app vormgeven"],
    ["Een bedrijfsproces stap voor stap tekenen", true],
  ]),
  bankQuestion(
    "BI",
    4,
    "Welk principe houdt in dat privacy vanaf het begin in een IT-ontwerp wordt ingebouwd?",
    [
      ["Zero Trust"],
      ["Privacy by Design", true],
      ["Least Privilege"],
      ["Defense in Depth"],
    ],
  ),
  bankQuestion("BI", 4, "Wat betekent Business-IT Alignment?", [
    ["Alle afdelingen dezelfde software laten gebruiken"],
    ["De IT-afdeling rechtstreeks onder de directie plaatsen"],
    ["De IT-strategie en de bedrijfsstrategie op elkaar afstemmen", true],
    ["De IT-kosten afstemmen op het gemiddelde in de branche"],
  ]),
  bankQuestion(
    "BI",
    5,
    "Waar staat de I van ACID bij databasetransacties voor?",
    [["Isolation", true], ["Integrity"], ["Indexing"], ["Immutability"]],
  ),
  bankQuestion("BI", 5, "Wat is het verschil tussen OLTP en OLAP?", [
    ["OLTP draait in de cloud, OLAP alleen lokaal"],
    ["OLAP is de nieuwere versie van OLTP"],
    ["OLTP is voor transacties, OLAP voor analyses", true],
    ["OLTP slaat tekst op, OLAP alleen getallen en datums"],
  ]),
  bankQuestion(
    "BI",
    5,
    "Welke impact heeft de overstap van Waterval naar Agile op de budgettering?",
    [
      ["Budgetten worden per project vooraf voor meerdere jaren vastgelegd"],
      ["Budget wordt pas toegekend na oplevering van het eindproduct"],
      ["Elk team bepaalt volledig zelfstandig zijn eigen budget"],
      [
        "Budget verschuift van losse projecten naar doorlopende financiering van vaste productteams",
        true,
      ],
    ],
  ),
  bankQuestion(
    "BI",
    5,
    "Waarvoor gebruik je Enterprise Architectuur (EA) bij een fusie?",
    [
      [
        "Inzicht houden in de samenhang tussen bedrijfsprocessen, data en IT-systemen",
        true,
      ],
      ["Bepalen welke programmeertaal de ontwikkelaars moeten gebruiken"],
      ["De planning van de integratie op projectniveau bijhouden"],
      ["De licentiekosten van de gecombineerde organisatie berekenen"],
    ],
  ),
  // ===================== SD (extra: backend, databases en tools) =====================
  bankQuestion("SD", 1, "Waar staat de S in SQL voor?", [
    ["Standard"],
    ["Structured", true],
    ["Sequential"],
    ["System"],
  ]),
  bankQuestion("SD", 1, "Welk decimaal getal is het binaire getal 01101?", [
    ["11"],
    ["9"],
    ["13", true],
    ["15"],
  ]),
  bankQuestion("SD", 2, "Wat doet het SQL-commando EXPLAIN?", [
    [
      "Het toont hoe de database een query gaat uitvoeren (het uitvoeringsplan)",
      true,
    ],
    ["Het toont de foutmelding van de laatst mislukte query"],
    [
      "Het voert een query uit in een transactie die daarna wordt teruggedraaid",
    ],
    ["Het genereert documentatie bij een stored procedure"],
  ]),
  bankQuestion("SD", 2, "Wat is een container?", [
    ["Een virtuele machine met een eigen besturingssysteem en kernel"],
    ["Een map op de server waarin alle bestanden van een applicatie staan"],
    ["Een fysieke server in een datacenter die voor één klant is gereserveerd"],
    [
      "Een geïsoleerde, lichtgewicht omgeving die een applicatie met haar afhankelijkheden draait",
      true,
    ],
  ]),
  bankQuestion(
    "SD",
    3,
    "Een gebruiker verstuurt een registratieformulier met een e-mailadres zonder '@'. Welke HTTP-statuscode geeft de API het best terug?",
    [
      ["401 Unauthorized"],
      ["400 Bad Request", true],
      ["404 Not Found"],
      ["500 Internal Server Error"],
    ],
  ),
  bankQuestion("SD", 3, "Wat doet git checkout?", [
    ["Wijzigingen van de remote ophalen en samenvoegen met je lokale branch"],
    ["Lokale commits uploaden naar de remote repository"],
    [
      "Wisselen van branch of bestanden herstellen naar een eerdere versie",
      true,
    ],
    ["Een overzicht tonen van gewijzigde en nog niet gecommitte bestanden"],
  ]),
  bankQuestion("SD", 4, "Wat betekent het dat een operatie idempotent is?", [
    ["De operatie geeft bij elke aanroep een ander resultaat"],
    ["De operatie kan na uitvoering niet meer ongedaan worden gemaakt"],
    ["De operatie wordt altijd binnen een vaste tijd uitgevoerd"],
    [
      "Meerdere keren uitvoeren geeft hetzelfde resultaat als één keer uitvoeren",
      true,
    ],
  ]),
  bankQuestion("SD", 4, "Wat is het N+1 query-probleem?", [
    [
      "Voor elk opgehaald record wordt een extra query uitgevoerd om gerelateerde data op te halen",
      true,
    ],
    ["Een transactie probeert tegelijk naar te veel tabellen te schrijven"],
    ["De database accepteert maximaal n gelijktijdige verbindingen"],
    [
      "Een query bevat per ongeluk een dubbele JOIN, waardoor er één rij te veel terugkomt",
    ],
  ]),
  bankQuestion(
    "SD",
    5,
    "Wat is de tijdscomplexiteit van binary search op een gesorteerde lijst?",
    [["O(n)"], ["O(n log n)"], ["O(log n)", true], ["O(1)"]],
  ),
  bankQuestion("SD", 5, "Wat doet een garbage collector?", [
    [
      "Ongebruikte variabelen uit de broncode verwijderen tijdens het compileren",
    ],
    [
      "Geheugen dat niet meer bereikbaar is automatisch opsporen en vrijgeven",
      true,
    ],
    ["Geheugenlekken melden zodat de programmeur ze handmatig kan oplossen"],
    [
      "Tijdelijke bestanden van de applicatie periodiek van de schijf verwijderen",
    ],
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
