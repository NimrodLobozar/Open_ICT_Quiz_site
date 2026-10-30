// De vragenbank voor een willekeurige quiz. Uit deze lijst kiest questionSelector.js de vragen,
// op basis van de vaardigheden van de spelers in de lobby.
//
// skill: één van de codes uit src/utils/skills.js (SD, AI, TI, CSC, GD, BI). Precies zo gespeld, met hoofdletters.
// difficulty: 1 = makkelijk, 2 = gemiddeld, 3 = moeilijk.
//
// Een vraag toevoegen? Zet hem bij de goede vaardigheid en draai `npm test`:
// de test "de vragenbank" controleert of alles klopt.
export const QUESTION_BANK = [
  // ---------- SD: software development ----------
  bankQuestion(
    "SD",
    1,
    "Welke van deze talen draait standaard in de browser?",
    [["Python"], ["JavaScript", true], ["C#"], ["PHP"]],
  ),
  bankQuestion("SD", 1, "Wat doet git commit?", [
    ["Code naar GitHub sturen"],
    ["Een nieuwe branch maken"],
    ["Wijzigingen lokaal vastleggen", true],
    ["Twee branches samenvoegen"],
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
    3,
    "Hoe snel is binair zoeken in een gesorteerde lijst (tijdscomplexiteit)?",
    [["O(1)"], ["O(log n)", true], ["O(n)"], ["O(n²)"]],
  ),
  bankQuestion("SD", 3, 'Waar staat de "S" voor in de SOLID-principes?', [
    ["Static typing"],
    ["Secure by default"],
    ["Single responsibility", true],
    ["Separation of data"],
  ]),

  // ---------- AI: artificial intelligence ----------
  bankQuestion("AI", 1, "Waar staat de afkorting AI voor?", [
    ["Automatische Invoer"],
    ["Artificial Intelligence", true],
    ["Advanced Internet"],
    ["Analoge Informatica"],
  ]),
  bankQuestion("AI", 1, "Waar leert een machine-learningmodel van?", [
    ["Van data", true],
    ["Van een snellere muis"],
    ["Van een groter beeldscherm"],
    ["Van een printer"],
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
    ["Het model is te groot voor de computer"],
    [
      "Het model leert de trainingsdata uit het hoofd en werkt slecht op nieuwe data",
      true,
    ],
    ["Het model traint te snel"],
    ["Het model heeft te weinig opslag"],
  ]),
  bankQuestion(
    "AI",
    3,
    "Waarvoor gebruik je een validatieset bij het trainen van een model?",
    [
      ["Om het model sneller te maken"],
      ["Om de trainingsdata groter te maken"],
      ["Om het model op te slaan"],
      [
        "Om instellingen te kiezen en overfitting te zien, met data waarop niet getraind is",
        true,
      ],
    ],
  ),
  bankQuestion("AI", 3, "Welke activatiefunctie berekent max(0, x)?", [
    ["Sigmoid"],
    ["ReLU", true],
    ["Softmax"],
    ["Tanh"],
  ]),

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
      ["De ingang hoog houden als de knop niet is ingedrukt", true],
      ["De knop sneller laten reageren"],
      ["De spanning verhogen naar 12 volt"],
      ["De stroom meten"],
    ],
  ),
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

  // ---------- CSC: cyber security en cloud ----------
  bankQuestion("CSC", 1, "Wat is phishing?", [
    ["Een soort firewall"],
    ["Een programmeertaal"],
    ["Nepberichten om gegevens te stelen", true],
    ["Een back-upmethode"],
  ]),
  bankQuestion("CSC", 1, "Welk wachtwoord is het veiligst?", [
    ["Je geboortedatum"],
    ["Een lang wachtwoord dat je nergens anders gebruikt", true],
    ["Hetzelfde wachtwoord voor alle websites"],
    ["Alleen kleine letters"],
  ]),
  bankQuestion("CSC", 2, "Waar staat de S in HTTPS voor?", [
    ["Speed"],
    ["Server"],
    ["Simple"],
    ["Secure", true],
  ]),
  bankQuestion("CSC", 2, "Wat is tweestapsverificatie (2FA)?", [
    [
      "Inloggen met iets wat je weet én iets wat je hebt, zoals een code op je telefoon",
      true,
    ],
    ["Twee keer je wachtwoord typen"],
    ["Op twee apparaten tegelijk inloggen"],
    ["Een wachtwoord van twee woorden"],
  ]),
  bankQuestion(
    "CSC",
    3,
    "Waarom sla je wachtwoorden op als hash (bijv. bcrypt) en niet als gewone tekst?",
    [
      ["Een hash neemt minder ruimte in"],
      ["Dan kan de gebruiker zonder wachtwoord inloggen"],
      ["Lekt de database, dan kan niemand de wachtwoorden zomaar lezen", true],
      ["Dan kun je het wachtwoord later terugmailen"],
    ],
  ),
  bankQuestion("CSC", 3, "Wat is SQL-injectie?", [
    ["Een snelle manier om een database te vullen"],
    ["Invoer van een gebruiker die als SQL-code wordt uitgevoerd", true],
    ["Een back-up terugzetten"],
    ["Een index toevoegen aan een tabel"],
  ]),

  // ---------- GD: game development ----------
  bankQuestion("GD", 1, "Waar staat FPS voor bij een game?", [
    ["Frames per second", true],
    ["Files per server"],
    ["Fast player speed"],
    ["Free points system"],
  ]),
  bankQuestion("GD", 1, "Wat is een sprite in een 2D-game?", [
    ["Een geluidseffect"],
    ["Een plaatje of figuurtje dat in de game beweegt", true],
    ["Een soort level"],
    ["Een opgeslagen spel"],
  ]),
  bankQuestion(
    "GD",
    2,
    "Waarom vermenigvuldig je een beweging met deltaTime?",
    [
      ["Zodat de game minder geheugen gebruikt"],
      ["Zodat de graphics scherper worden"],
      ["Zodat de snelheid gelijk blijft, ook als de framerate verandert", true],
      ["Zodat het geluid gelijk loopt met het beeld"],
    ],
  ),
  bankQuestion("GD", 2, "Wat is een hitbox?", [
    ["Een doos met power-ups"],
    ["Het pauzemenu van een game"],
    ["Een grafische kaart"],
    ["Een (onzichtbare) vorm waarmee de game botsingen bepaalt", true],
  ]),
  bankQuestion(
    "GD",
    3,
    "Waarvoor gebruikt een 3D-engine meestal een quaternion?",
    [
      ["Om een rotatie op te slaan zonder gimbal lock", true],
      ["Om een kleur op te slaan"],
      ["Om een geluid af te spelen"],
      ["Om een texture te comprimeren"],
    ],
  ),
  bankQuestion("GD", 3, "Wat is culling in game-graphics?", [
    ["Alle objecten twee keer tekenen"],
    ["Objecten die je toch niet ziet, niet tekenen", true],
    ["Textures groter maken"],
    ["De framerate vastzetten"],
  ]),

  // ---------- BI: business en IT ----------
  bankQuestion("BI", 1, "Wat is een database?", [
    ["Een soort beeldscherm"],
    ["Een programmeertaal"],
    ["Een georganiseerde verzameling gegevens", true],
    ["Een netwerkkabel"],
  ]),
  bankQuestion("BI", 1, "Waar staat de afkorting KPI voor?", [
    ["Key Performance Indicator", true],
    ["Klant Product Index"],
    ["Key Program Interface"],
    ["Kwaliteit Per Item"],
  ]),
  bankQuestion("BI", 2, "Welke SQL-opdracht haalt rijen op uit een tabel?", [
    ["GET"],
    ["SELECT", true],
    ["FETCH"],
    ["PULL"],
  ]),
  bankQuestion("BI", 2, "Wat is een stakeholder in een IT-project?", [
    ["De server waarop het project draait"],
    ["Het eerste deel van de code"],
    ["Een soort testscript"],
    ["Iemand die belang heeft bij het project of er invloed op heeft", true],
  ]),
  bankQuestion("BI", 3, "Wat doet GROUP BY in SQL?", [
    [
      "Rijen met dezelfde waarde samennemen, bijvoorbeeld om per groep te tellen",
      true,
    ],
    ["Rijen sorteren"],
    ["Een tabel verwijderen"],
    ["Twee databases koppelen"],
  ]),
  bankQuestion("BI", 3, "Wat is het doel van een database normaliseren?", [
    ["De database sneller laten opstarten"],
    ["Dubbele gegevens voorkomen en de structuur logisch houden", true],
    ["Alle tabellen samenvoegen tot één tabel"],
    ["De gegevens versleutelen"],
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
