import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/http.js'

/**
 * "Wie ben ik in deze game?" Vraagt GET /api/games/:code/me.
 * De server kijkt naar de httpOnly-cookie (quiz_host / quiz_player). Zo werkt rejoinen:
 * heb je nog een geldige cookie, dan zit je er meteen weer in.
 *
 * @param {string | undefined} code joincode
 * @param {'host' | 'player'} [role] alleen naar deze rol kijken
 * @returns {{
 *   status: 'idle' | 'loading' | 'ok' | 'no-session' | 'not-found' | 'error',
 *   session: { role: string, playerId?: string, nickname?: string } | null,
 *   refresh: () => void,
 * }}
 */
export function useGameSession(code, role) {
  const [state, setState] = useState({ status: code ? 'loading' : 'idle', session: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!code) return
    let cancelled = false
    const query = role ? `?role=${role}` : ''

    api(`/games/${code}/me${query}`)
      .then((session) => !cancelled && setState({ status: 'ok', session }))
      .catch((error) => {
        if (cancelled) return
        const status =
          error.error === 'NO_SESSION'
            ? 'no-session'
            : error.error === 'GAME_NOT_FOUND'
              ? 'not-found'
              : 'error'
        setState({ status, session: null })
      })

    return () => {
      cancelled = true
    }
  }, [code, role, attempt])

  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, refresh }
}
