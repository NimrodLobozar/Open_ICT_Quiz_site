import { useEffect, useState } from 'react'
import { api } from '../../api/http.js'
import { Notice, StatTiles } from '../../components/AccountUi.jsx'
import { useDebounced } from '../../hooks/useDebounced.js'
import { formatDayTime } from '../../utils/formatDate.js'
import { formatScore } from '../../utils/formatScore.js'
import AdminLayout from './AdminLayout.jsx'
import SearchField from './SearchField.jsx'

/**
 * /admin/uitslagen: gespeelde rondes en de eindstand per ronde. Design "10 · Admin — uitslagen".
 * Een docent ziet de rondes van zijn eigen quizzen, een beheerder alles.
 * De plaatsen komen uit de database (momentopname van getRanking op het podium), dus gelijk aan wat de klas zag.
 */
export default function ResultsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [round, setRound] = useState(null)
  const [error, setError] = useState(null)
  const query = useDebounced(search)

  useEffect(() => setPage(1), [query])

  useEffect(() => {
    let cancelled = false
    api(`/admin/results?page=${page}&q=${encodeURIComponent(query)}`)
      .then((result) => {
        if (cancelled) return
        setData(result)
        // Eerste ronde meteen openen, zoals in het design.
        setSelectedId((current) => (result.rounds.some((r) => r.id === current) ? current : (result.rounds[0]?.id ?? null)))
      })
      .catch((apiError) => !cancelled && setError(apiError.message))
    return () => {
      cancelled = true
    }
  }, [page, query])

  useEffect(() => {
    if (!selectedId) return setRound(null)
    let cancelled = false
    api(`/admin/results/${selectedId}`)
      .then((result) => !cancelled && setRound(result))
      .catch((apiError) => !cancelled && setError(apiError.message))
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const stats = data && [
    { value: data.stats.rounds, label: 'Rondes gespeeld' },
    { value: data.stats.players, label: 'Deelnames' },
    { value: data.stats.accountPercent == null ? '–' : `${data.stats.accountPercent}%`, label: 'Met account' },
  ]
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <AdminLayout kicker="Gespeelde rondes" title="UITSLAGEN">
      <Notice>{error}</Notice>
      {stats && <StatTiles stats={stats} label="Cijfers" />}
      <SearchField label="Zoek op quiz of code" value={search} onChange={setSearch} />

      <div className="admin-results">
        <section aria-labelledby="rounds-title" className="admin-table admin-results__rounds">
          <h2 id="rounds-title" className="ui-sr-only">
            Rondes
          </h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Quiz</th>
                <th scope="col">Datum</th>
                <th scope="col" className="is-number">
                  Spelers
                </th>
                <th scope="col">Winnaar</th>
              </tr>
            </thead>
            <tbody>
              {data?.rounds.map((r) => (
                <tr key={r.id} className={r.id === selectedId ? 'is-selected' : ''}>
                  <td>
                    {/* Een echte knop, zodat je de ronde ook met het toetsenbord kunt kiezen. */}
                    <button type="button" className="admin-results__pick" aria-pressed={r.id === selectedId} onClick={() => setSelectedId(r.id)}>
                      <strong>{r.quizTitle}</strong>
                      <span>
                        {r.code} · ronde {r.round}
                      </span>
                    </button>
                  </td>
                  <td className="admin-table__muted">{formatDayTime(r.endedAt)}</td>
                  <td className="is-number">{r.playerCount}</td>
                  <td>
                    <strong>{r.winner ?? '—'}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.rounds.length === 0 && <p className="admin-page__empty">Nog geen gespeelde rondes. Host een quiz; na het podium staat de uitslag hier.</p>}
          {data && data.total > 0 && (
            <div className="admin-pager admin-pager--inside">
              <span>
                {data.rounds.length} van {data.total} rondes
              </span>
              <span className="admin-pager__buttons">
                <button type="button" className="ui-btn ui-btn--small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Vorige
                </button>
                <button type="button" className="ui-btn ui-btn--small" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Volgende
                </button>
              </span>
            </div>
          )}
        </section>

        {round && (
          <section aria-labelledby="standings-title" className="ui-card admin-results__standings">
            <div className="admin-results__standings-head">
              <h2 id="standings-title" className="ui-section-title">
                Eindstand
              </h2>
              <strong>{round.quizTitle}</strong>
              <span>
                {round.code} · ronde {round.round} · {formatDayTime(round.endedAt)}
              </span>
            </div>
            <ol className="admin-results__list">
              {round.standings.map((player, index) => (
                <li key={index} className={player.rank <= 3 ? 'is-podium' : ''}>
                  <span className="admin-results__rank">{player.rank}</span>
                  <span className="admin-results__name">
                    <span>{player.nickname}</span>
                    {player.isVerified && (
                      <svg role="img" aria-label="Speelde met account" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12.5l2.5 2.5L16 9.5" />
                      </svg>
                    )}
                    {player.isBot && <span className="admin-results__bot">testspeler</span>}
                  </span>
                  <span className="admin-results__correct">
                    {player.correctCount}/{round.questionCount}
                  </span>
                  <strong className="admin-results__score">{formatScore(player.score)}</strong>
                </li>
              ))}
            </ol>
            <span className="ui-hint">Gelijke score = gedeelde plaats.</span>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}
