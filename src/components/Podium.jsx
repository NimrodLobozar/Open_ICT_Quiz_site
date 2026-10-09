import { formatScore } from '../utils/formatScore.js'
import './Podium.css'

/**
 * Top 3 van de quiz als grote "quizshow"-balken.
 * @param {{ ranking: Array<{ id: number, nickname: string, score: number, rank: number }> }} props
 *   ranking = uitkomst van getRanking(), dus al gesorteerd en met rank.
 */
export default function Podium({ ranking }) {
  const winners = ranking.slice(0, 3)

  if (winners.length === 0) {
    return <p className="podium__empty">Er zijn nog geen scores.</p>
  }

  return (
    <ol className="podium" aria-label="Winnaars">
      {winners.map((winner) => (
        // De stijl hangt af van rank, niet van de positie in de lijst:
        // delen twee spelers de 1e plek, dan krijgen ze allebei de grote balk.
        <li key={winner.id} className={`podium__place ${winner.rank === 1 ? 'podium__place--first' : ''}`}>
          <div className="podium__bar">
            <span className="podium__rank">{winner.rank}</span>
            <span className="podium__name">{winner.nickname}</span>
            <span className="podium__score">{formatScore(winner.score)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
