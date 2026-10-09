import { formatScore } from '../utils/formatScore.js'
import './Scoreboard.css'

/**
 * Alle spelers ná de top 3, in twee kolommen.
 * @param {{ ranking: Array<{ id: number, nickname: string, score: number, rank: number }> }} props
 *   Dezelfde ranking als het podium, zodat de plekken altijd overeenkomen.
 */
export default function Scoreboard({ ranking }) {
  const rest = ranking.slice(3)

  if (rest.length === 0) return null

  return (
    <ol className="scoreboard" aria-label="Overige plekken">
      {rest.map((player) => (
        <li key={player.id} className="scoreboard__row">
          <div className="scoreboard__bar">
            <span className="scoreboard__rank">{player.rank}</span>
            <span className="scoreboard__name">{player.nickname}</span>
            <span className="scoreboard__score">{formatScore(player.score)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
