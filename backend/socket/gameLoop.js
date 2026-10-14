import { saveGameResultsInBackground } from '../db/gameResults.js'
import { PHASES } from '../game/phases.js'
import { sendPodium, sendProgress, sendQuestion, sendQuestionEnd } from './broadcast.js'

// De klok van de game loop (projectplan fase 4).
// Game.js beslist wat er mag; dit bestand zorgt dat het ook op tijd gebeurt (leestijd voorbij, tijd op)
// en dat iedereen het hoort. De server is de baas over de tijd: een client kan zijn klok verzetten.

/** @type {Map<string, NodeJS.Timeout>} gamecode → de timer die nu loopt (maximaal één per game) */
const timers = new Map()

/**
 * Aanroepen na élke verandering van fase (host:start, host:next, timer, iedereen geantwoord).
 * Stuurt het nieuwe scherm naar iedereen en zet de timer voor de volgende stap.
 */
export function afterPhaseChange(io, game) {
  // Eerst de oude timer weg: stopt de host de tijd, dan mag de oude timer niet nóg een keer de vraag stoppen.
  stopTimer(game.code)

  switch (game.phase) {
    case PHASES.QUESTION_PREVIEW:
      sendQuestion(io, game)
      schedule(io, game, game.startsAt, () => game.openAnswers())
      break
    case PHASES.QUESTION_ACTIVE:
      sendQuestion(io, game)
      sendProgress(io, game)
      schedule(io, game, game.endsAt, () => game.endQuestion())
      break
    case PHASES.QUESTION_RESULT:
      sendQuestionEnd(io, game)
      break
    case PHASES.PODIUM:
      sendPodium(io, game)
      // Na het podium, zodat de spelers niet op de database wachten.
      saveGameResultsInBackground(game)
      break
  }
}

/** Na een antwoord of een speler die wegvalt: host bijwerken, en meteen stoppen als iedereen er is. */
export function afterAnswer(io, game) {
  if (game.phase !== PHASES.QUESTION_ACTIVE) return
  sendProgress(io, game)
  if (game.allAnswered()) {
    game.endQuestion()
    afterPhaseChange(io, game)
  }
}

export function stopTimer(code) {
  clearTimeout(timers.get(code))
  timers.delete(code)
}

// Op tijdstip `at` (ms) de stap uitvoeren en daarna weer afterPhaseChange.
function schedule(io, game, at, step) {
  const timer = setTimeout(
    () => {
      timers.delete(game.code)
      try {
        step()
        afterPhaseChange(io, game)
      } catch (error) {
        // Bijv. WRONG_PHASE als de host net op hetzelfde moment op "volgende" drukte. Dan is er niets te doen.
        console.error(`Timer van game ${game.code}:`, error.message)
      }
    },
    Math.max(0, at - Date.now()),
  )
  timers.set(game.code, timer)
}
