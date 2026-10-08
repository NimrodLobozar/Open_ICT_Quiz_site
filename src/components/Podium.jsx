import './Podium.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Vaste posities voor de confetti (geen Math.random, anders springt alles bij elke render).
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 8) * 0.4}s`,
  duration: `${3 + (i % 5) * 0.5}s`,
  color: ['#f5c518', '#ff5c8a', '#4cc9f0', '#7ae582', '#b388ff'][i % 5],
}))

/**
 * Podium met de top 3 van de quiz.
 * @param {{ ranking: Array<{ id: number, nickname: string, score: number, rank: number }> }} props
 *   ranking = uitkomst van getRanking(), dus al gesorteerd en met rank.
 */
export default function Podium({ ranking }) {
  const winners = ranking.slice(0, 3)

  if (winners.length === 0) {
    return <p className="podium__empty">Er zijn nog geen scores.</p>
  }

  // Klassieke podiumvolgorde: 2e links, 1e in het midden, 3e rechts.
  // filter(Boolean) haalt lege plekken weg als er minder dan drie spelers zijn.
  const podiumOrder = [winners[1], winners[0], winners[2]].filter(Boolean)

  return (
    <section className="podium" aria-label="Winnaars">
      <div className="podium__confetti" aria-hidden="true">
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              background: piece.color,
            }}
          />
        ))}
      </div>

      <h1 className="podium__title">🎉 De winnaars 🎉</h1>

      <ol className="podium__stand">
        {podiumOrder.map((winner) => (
          <li key={winner.id} className={`podium__place podium__place--${winner.rank}`}>
            {winner.rank === 1 && <span className="podium__crown" aria-hidden="true">👑</span>}
            <span className="podium__name">{winner.nickname}</span>
            <span className="podium__score">{winner.score} punten</span>
            <div className="podium__block">
              <span className="podium__medal" aria-hidden="true">{MEDALS[winner.rank]}</span>
              <span className="podium__rank">{winner.rank}e</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
