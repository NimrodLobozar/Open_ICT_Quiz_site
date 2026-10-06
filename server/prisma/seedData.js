// Voorbeelddata voor de seed. Pas gerust aan of voeg quizzen toe.
// Elke vraag: tekst, difficulty (1 = makkelijk, 2 = gemiddeld, 3 = moeilijk),
// 4 opties waarvan precies één `correct: true`.

export const roles = [
  { key: 'ai', name: 'AI Engineering', color: '#722ed1' },
  { key: 'frontend', name: 'Frontend', color: '#1677ff' },
  { key: 'backend', name: 'Backend', color: '#13c2c2' },
  { key: 'cyber', name: 'Cybersecurity', color: '#f5222d' },
  { key: 'business', name: 'IT & Business', color: '#fa8c16' },
  { key: 'infra', name: 'Infrastructuur/Cloud', color: '#52c41a' },
]

// Kort hulpje: q('vraag', difficulty, ['juist', 'fout', 'fout', 'fout'])
// Het EERSTE antwoord is het juiste; de volgorde wordt in de seed gehusseld.
function q(text, difficulty, [correct, ...wrong]) {
  return {
    text,
    difficulty,
    options: [{ text: correct, correct: true }, ...wrong.map((text) => ({ text, correct: false }))],
  }
}

export const quizzes = [
  {
    title: 'Web basics',
    description: 'HTML, CSS en JavaScript: de bouwstenen van elke website.',
    roleKey: 'frontend',
    questions: [
      q('Waar staat HTML voor?', 1, [
        'HyperText Markup Language',
        'HighText Machine Language',
        'Hyperlink and Text Markup Language',
        'Home Tool Markup Language',
      ]),
      q('Welke taal gebruik je om een webpagina op te maken (kleuren, lettertypes)?', 1, [
        'CSS',
        'HTML',
        'SQL',
        'Python',
      ]),
      q('Welke HTML-tag gebruik je voor de grootste kop?', 1, [
        '<h1>',
        '<head>',
        '<h6>',
        '<header>',
      ]),
      q('Welke CSS-eigenschap verandert de tekstkleur?', 1, [
        'color',
        'font-color',
        'text-color',
        'background-color',
      ]),
      q('Wat is het verschil tussen let en const in JavaScript?', 2, [
        'Een const kun je niet opnieuw toewijzen',
        'let is sneller dan const',
        'const werkt alleen in functies',
        'Er is geen verschil',
      ]),
      q('Wat geeft typeof null in JavaScript?', 3, [
        '"object"',
        '"null"',
        '"undefined"',
        '"number"',
      ]),
      q('Welke CSS-layout is bedoeld voor rijen én kolommen tegelijk?', 2, [
        'Grid',
        'Flexbox',
        'Float',
        'Inline-block',
      ]),
      q('Welke HTTP-statuscode betekent "Not Found"?', 2, ['404', '200', '500', '301']),
    ],
  },
  {
    title: 'Netwerken & security',
    description: 'Van IP-adressen tot phishing: hoe blijf je veilig online?',
    roleKey: 'cyber',
    questions: [
      q('Wat doet een firewall?', 1, [
        'Netwerkverkeer filteren op basis van regels',
        'Virussen van je harde schijf verwijderen',
        'Je internetverbinding sneller maken',
        'Wachtwoorden opslaan',
      ]),
      q('Wat is phishing?', 1, [
        'Via nepberichten iemand gegevens laten afgeven',
        'Een netwerk scannen op open poorten',
        'Een database leegmaken',
        'Een vorm van versleuteling',
      ]),
      q('Waar staat de S in HTTPS voor?', 1, ['Secure', 'Simple', 'Server', 'Standard']),
      q('Op welke poort draait HTTPS standaard?', 2, ['443', '80', '22', '8080']),
      q('Wat doet DNS?', 2, [
        'Domeinnamen vertalen naar IP-adressen',
        'Bestanden versleutelen',
        'IP-adressen uitdelen aan apparaten',
        'E-mail versturen',
      ]),
      q('Welke aanval probeert eigen SQL-code via een invoerveld uit te voeren?', 2, [
        'SQL-injectie',
        'Cross-site scripting',
        'Brute force',
        'Man-in-the-middle',
      ]),
      q('Hoeveel bits heeft een IPv4-adres?', 3, ['32', '64', '128', '16']),
      q('Waarom "salt" je een wachtwoord voordat je het hasht?', 3, [
        'Zodat gelijke wachtwoorden verschillende hashes krijgen',
        'Zodat het wachtwoord later te ontsleutelen is',
        'Zodat hashen sneller gaat',
        'Zodat het wachtwoord korter wordt',
      ]),
    ],
  },
  {
    title: 'ICT algemeen',
    description: 'Een mix van AI, backend, cloud en business. Voor iedereen.',
    roleKey: null,
    questions: [
      q('Wat is Git?', 1, [
        'Een versiebeheersysteem',
        'Een programmeertaal',
        'Een database',
        'Een besturingssysteem',
      ]),
      q('Wat betekent "de cloud" meestal?', 1, [
        'Software en opslag op servers via internet',
        'Een draadloos netwerk thuis',
        'Een back-up op een USB-stick',
        'Een soort processor',
      ]),
      q('Waar staat API voor?', 1, [
        'Application Programming Interface',
        'Advanced Program Integration',
        'Automatic Processing Input',
        'Application Process Index',
      ]),
      q('Wat is een LLM?', 2, [
        'Een groot taalmodel dat tekst kan genereren',
        'Een soort netwerkkabel',
        'Een programmeertaal voor databases',
        'Een type harde schijf',
      ]),
      q('Welke SQL-opdracht gebruik je om gegevens op te halen?', 2, [
        'SELECT',
        'GET',
        'FETCH',
        'READ',
      ]),
      q('Wat is Docker?', 2, [
        'Software om applicaties in containers te draaien',
        'Een Git-hostingplatform',
        'Een JavaScript-framework',
        'Een virusscanner',
      ]),
      q('Wat is een "user story" in Scrum?', 2, [
        'Een korte beschrijving van wat een gebruiker wil bereiken',
        'Een technisch ontwerp van de database',
        'Een verslag van de sprint retrospective',
        'Een handleiding voor gebruikers',
      ]),
      q('Wat is "overfitting" bij machine learning?', 3, [
        'Een model leert de trainingsdata te goed en presteert slecht op nieuwe data',
        'Een model is te klein voor de data',
        'De trainingsdata past niet in het geheugen',
        'Het model traint te snel',
      ]),
    ],
  },
]
