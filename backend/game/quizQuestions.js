// De vragen van de quiz, zolang er nog geen Quiz/Question-tabellen in de database zijn (projectplan 12).
// Ze staan op de server, omdat alleen de server mag weten welk antwoord goed is (isCorrect).
// De clients krijgen een vraag pas te zien zonder isCorrect (zie Game.getQuestionPayload).
// TODO(team): uit de database halen zodra Quiz, Question en AnswerOption bestaan.
// Let op: src/data/dummyDatabase.js heeft dezelfde vragen voor de demo-pagina's.

export const QUIZ_QUESTIONS = [
  question('Waar staat de afkorting HTML voor?', [
    ['HyperText Markup Language', true],
    ['High Tech Modern Language'],
    ['Home Tool Markup Language'],
    ['Hyperlink Text Mode Layout'],
  ]),
  question('Welke van deze talen draait standaard in de browser?', [
    ['Python'],
    ['JavaScript', true],
    ['C#'],
    ['PHP'],
  ]),
  question('Welke HTTP-statuscode betekent dat een pagina niet gevonden is?', [
    ['200'],
    ['301'],
    ['404', true],
    ['500'],
  ]),
  question('Wat doet git commit?', [
    ['Code naar GitHub sturen'],
    ['Wijzigingen lokaal vastleggen', true],
    ['Een nieuwe branch maken'],
    ['Twee branches samenvoegen'],
  ]),
  question('Welke SQL-opdracht haalt rijen op uit een tabel?', [
    ['GET'],
    ['SELECT', true],
    ['FETCH'],
    ['PULL'],
  ]),
  question('Hoeveel bits zitten er in één byte?', [['4'], ['8', true], ['16'], ['32']]),
  question('Wat is phishing?', [
    ['Een soort firewall'],
    ['Een programmeertaal'],
    ['Nepberichten om gegevens te stelen', true],
    ['Een back-upmethode'],
  ]),
  question('Waar staat de afkorting AI voor?', [
    ['Automatische Invoer'],
    ['Artificial Intelligence', true],
    ['Advanced Internet'],
    ['Analoge Informatica'],
  ]),
]

// Korte schrijfwijze: [tekst, true] is het goede antwoord. De ids tellen per vraag vanaf 1.
function question(text, options, timeLimitSec = 20) {
  return {
    text,
    timeLimitSec,
    options: options.map(([optionText, isCorrect = false], i) => ({ id: i + 1, text: optionText, isCorrect })),
  }
}
