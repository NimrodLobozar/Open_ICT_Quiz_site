// ALLEEN VOOR ONTWIKKELEN.
// De game loop met echte vragen (fase 4) bestaat nog niet. Om het eindscherm toch te kunnen testen,
// speelt deze functie alle vragen "nep" voor elke speler. Haal dit weg zodra de echte vragen er zijn.

// Sommige lang (20 tekens is het maximum) en sommige gelijk, om de lay-out en gedeelde plekken te testen.
const BOT_NAMES = [
  'Sanne', 'Daan', 'Fatima', 'Lucas', 'Noah', 'Mo', 'Yara', 'Tim_04', 'quizkoning',
  'Maximiliaan v.d.Berg', 'WWWWWWWWWWWWWWWWWWWW', 'Anne-Sophie Jansen', 'Ayoub', 'Lotte',
]

/** Voegt testspelers toe die niet echt verbonden zijn. */
export function addBots(game, count) {
  for (let i = 0; i < count; i++) {
    const base = BOT_NAMES[i % BOT_NAMES.length]
    const suffix = i < BOT_NAMES.length ? '' : ` ${Math.floor(i / BOT_NAMES.length) + 1}`
    // slice(0, 20): de naamregel staat maximaal 20 tekens toe.
    const nickname = (base.slice(0, 20 - suffix.length) + suffix).trim()
    try {
      game.addPlayer(nickname, { isBot: true })
    } catch {
      // Naam bestond al (bijv. een echte speler heet ook Sanne): deze bot overslaan.
    }
  }
}

/**
 * Speelt alle vragen voor iedereen.
 * Punten per goed antwoord: 1000, min 100 per "seconde te laat" (0–5). Daardoor komen gelijke scores vaak voor.
 */
export function simulateAnswers(game, random = Math.random) {
  for (const player of game.players.values()) {
    for (let questionIndex = 0; questionIndex < game.totalQuestions; questionIndex++) {
      const correct = random() < 0.6
      const points = correct ? 1000 - 100 * Math.floor(random() * 6) : 0
      game.recordAnswer(player.id, { questionIndex, correct, points })
    }
  }
}
