import { EVENTS } from '../socket/events.js'
import { withLocalStartsAt } from '../socket/serverTime.js'
import { useSocketEvent } from './useSocketEvent.js'

/**
 * Houdt de vraag-lus bij in de game-toestand van een pagina (host én speler).
 * De velden heten hetzelfde als in de state van game:sync, zodat verversen en live-events
 * precies dezelfde toestand opleveren.
 * @param {(update: (current: object | null) => object | null) => void} setGame
 */
export function useQuestionEvents(setGame) {
  // Nieuwe vraag, of dezelfde vraag die van leestijd naar antwoorden gaat.
  useSocketEvent(EVENTS.QUESTION_SHOW, (question) => {
    setGame((current) => {
      if (!current) return current
      const sameQuestion = current.question?.index === question.index
      return {
        ...current,
        phase: question.phase,
        question: withLocalStartsAt(question),
        // Bij een nieuwe vraag: oude keuze en uitslag weg. Bij dezelfde vraag je keuze bewaren.
        myAnswer: sameQuestion ? current.myAnswer : null,
        progress: sameQuestion ? current.progress : null,
        questionEnd: null,
        myQuestionResult: null,
      }
    })
  })

  useSocketEvent(EVENTS.QUESTION_PROGRESS, (progress) => {
    setGame((current) => current && { ...current, progress })
  })

  useSocketEvent(EVENTS.QUESTION_END, (questionEnd) => {
    setGame((current) => {
      if (!current) return current
      // Je eigen totaalscore staat in de tussenstand. Die tonen we onder de volgende vraag.
      const myRow = current.me && questionEnd.ranking.find((row) => row.id === current.me.playerId)
      return {
        ...current,
        phase: 'QUESTION_RESULT',
        questionEnd,
        me: myRow ? { ...current.me, score: myRow.score } : current.me,
      }
    })
  })

  // Alleen naar deze speler gestuurd, direct na question:end.
  useSocketEvent(EVENTS.QUESTION_MY_RESULT, (myQuestionResult) => {
    setGame((current) => current && { ...current, myQuestionResult })
  })
}
