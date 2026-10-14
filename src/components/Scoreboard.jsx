import { useEffect, useRef } from 'react'
import { formatScore } from '../utils/formatScore.js'
import './Scoreboard.css'

/**
 * Lijst met plek, naam en score.
 * - Host: de plekken ná het podium, in twee kolommen (`rows={ranking.slice(3)} columns={2}`).
 * - Speler: de hele eindstand, scrollbaar, met de eigen rij gemarkeerd (`myPlayerId`).
 *
 * @param {{
 *   rows: Array<{ id: number, nickname: string, score: number, rank: number }>,
 *   myPlayerId?: number | null,
 *   columns?: 1 | 2,
 *   label?: string,
 * }} props
 *   rows komen uit getRanking() (via de server), dus al gesorteerd en met rank.
 *   Zo zijn podium, tussenstand en scoreboard het altijd eens.
 */
export default function Scoreboard({ rows, myPlayerId = null, columns = 1, label = 'Overige plekken' }) {
  const listRef = useRef(null)
  const myRowRef = useRef(null)

  // Staat je eigen rij niet in beeld, dan scrollen we de lijst ernaartoe (alleen de lijst, niet de pagina).
  useEffect(() => {
    scrollRowIntoList(listRef.current, myRowRef.current)
  }, [rows, myPlayerId])

  if (rows.length === 0) return null

  const scrollable = columns === 1

  return (
    <ol
      ref={listRef}
      className={`scoreboard ${scrollable ? 'scoreboard--list' : 'scoreboard--columns'}`}
      aria-label={label}
      // Een scrollbaar gebied moet met het toetsenbord te bereiken zijn (Tab + pijltjes).
      tabIndex={scrollable ? 0 : undefined}
    >
      {rows.map((player) => {
        const isMe = player.id === myPlayerId
        return (
          <li
            key={player.id}
            ref={isMe ? myRowRef : undefined}
            className={`scoreboard__row ${isMe ? 'scoreboard__row--me' : ''}`}
            // aria-current vertelt een schermlezer dat dit "jouw" rij is.
            aria-current={isMe ? 'true' : undefined}
          >
            <div className="scoreboard__bar">
              <span className="scoreboard__rank">{player.rank}</span>
              <span className="scoreboard__name">
                {player.nickname}
                {/* Niet alleen kleur: ook tekst, zodat kleurenblinde spelers hun rij vinden. */}
                {isMe && <span className="scoreboard__me"> (jij)</span>}
              </span>
              <span className="scoreboard__score">{formatScore(player.score)}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function scrollRowIntoList(list, row) {
  if (!list || !row) return
  const rowTop = row.offsetTop
  const rowBottom = rowTop + row.offsetHeight
  const visible = rowTop >= list.scrollTop && rowBottom <= list.scrollTop + list.clientHeight
  if (visible) return
  // Rij in het midden zetten, zodat je ziet wie boven en onder je staat.
  list.scrollTop = rowTop - (list.clientHeight - row.offsetHeight) / 2
}
