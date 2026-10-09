import { Link } from 'react-router-dom'
import QuizHeader from '../../components/QuizHeader.jsx'
import Scoreboard from '../../components/Scoreboard.jsx'
import { gameResults, gameSessions } from '../../data/dummyDatabase.js'
import { formatScore } from '../../utils/formatScore.js'
import { buildPlayerResult } from '../../utils/playerResult.js'
import { getRanking } from '../../utils/ranking.js'
import './EndScreenPage.css'

/**
 * Eindscherm van de speler: links je eigen resultaat, rechts de eindstand.
 * Alle getallen komen van de server (game:podium + player:result); hier wordt niets berekend.
 *
 * @param {{
 *   code: string,
 *   ranking: Array<{ id: number, nickname: string, score: number, rank: number }>,
 *   result: { playerId: number, nickname: string, rank: number, playerCount: number, totalScore: number,
 *     correctCount: number, totalQuestions: number, nextRank: number | null, pointsToNext: number | null,
 *     isGuest: boolean } | null,
 *   onLeave: () => void,
 *   leaving?: boolean,
 *   leaveError?: string | null,
 * }} props
 */
export function PlayerEndScreen({ code, ranking, result, onLeave, leaving = false, leaveError = null }) {
  return (
    <div className="player-end">
      <QuizHeader code={code} />

      <main className="player-end__main">
        <section className="player-end__me" aria-labelledby="player-end-title">
          {result ? <MyResult result={result} /> : <p role="status">Je resultaat wordt geladen…</p>}
        </section>

        <section className="player-end__standings" aria-labelledby="player-end-standings">
          <h2 id="player-end-standings" className="player-end__subtitle">
            EINDSTAND
          </h2>
          <Scoreboard rows={ranking} myPlayerId={result?.playerId ?? null} label="Eindstand van alle spelers" />
        </section>

        <div className="player-end__actions">
          {/* Accounts komen bij L1. Tot die tijd is iedereen gast; de knop wijst naar een placeholder. */}
          {result?.isGuest && (
            <>
              <p className="player-end__guest-note">Als gast wordt je score na de quiz gewist.</p>
              <Link to="/account/nieuw" className="player-end__button player-end__button--primary">
                Account maken en score bewaren
              </Link>
            </>
          )}
          <button type="button" className="player-end__button" onClick={onLeave} disabled={leaving}>
            {leaving ? 'Bezig…' : 'Terug naar start'}
          </button>
          {leaveError && (
            <p className="player-end__error" role="alert">
              {leaveError}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

function MyResult({ result }) {
  const { nickname, rank, playerCount, totalScore, correctCount, totalQuestions, nextRank, pointsToNext } = result
  const won = rank === 1

  return (
    <>
      {/* Eén kop, zodat een schermlezer de hele zin voorleest: "Emma, jij bent 8e van 12 spelers". */}
      <h1 id="player-end-title" className="player-end__title">
        <span className="player-end__intro">{nickname}, jij bent</span>
        <span className="player-end__banner">
          <span className="player-end__place">{rank}e</span>
          <span className="player-end__count">
            van {playerCount} {playerCount === 1 ? 'speler' : 'spelers'}
          </span>
        </span>
      </h1>

      <dl className="player-end__cards">
        <div className="player-end__card">
          <dt>Punten</dt>
          <dd>{formatScore(totalScore)}</dd>
        </div>
        <div className="player-end__card">
          <dt>Goed</dt>
          <dd>
            {correctCount}/{totalQuestions}
          </dd>
        </div>
        {won ? (
          <div className="player-end__card player-end__card--win">
            <dt>Uitslag</dt>
            <dd>Gewonnen!</dd>
          </div>
        ) : (
          <div className="player-end__card">
            <dt>Tot {nextRank}e</dt>
            <dd>
              {formatScore(pointsToNext)}
              <span className="player-end__sr-only"> punten</span>
            </dd>
          </div>
        )}
      </dl>
    </>
  )
}

// Demo op /end-player met nepdata, om het design te bekijken zonder een hele game te spelen.
// Speler 7 (Emma) is "jij". Zet DEMO_PLAYER_ID op 1 om het winnaarsscherm te zien.
const DEMO_PLAYER_ID = 7

export default function EndScreenPagePlayer() {
  const session = gameSessions[0]
  const ranking = getRanking(gameResults.map((r) => ({ ...r, isVerified: r.userId !== null })))
  const result = buildPlayerResult(ranking, DEMO_PLAYER_ID, session.totalQuestions)

  return <PlayerEndScreen code={session.code} ranking={ranking} result={result} onLeave={() => {}} />
}
