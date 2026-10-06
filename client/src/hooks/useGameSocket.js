import { useEffect, useState } from 'react'
import { GAME_SYNC } from '../socket/events.js'
import { connectToGame, disconnectFromGame, emitWithAck, socket } from '../socket/socket.js'

/**
 * Verbindt de socket met een game zolang de pagina open is, en haalt na elke
 * (her)verbinding de actuele toestand op via `game:sync`.
 *
 * @param {string} code joincode
 * @param {'host' | 'player'} role
 * @param {boolean} enabled pas verbinden als de sessie-check gelukt is
 * @returns {{ connected: boolean, state: object | null, error: { error: string, message: string } | null }}
 */
export function useGameSocket(code, role, enabled) {
  const [connected, setConnected] = useState(false)
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) return

    async function onConnect() {
      setConnected(true)
      setError(null)
      const response = await emitWithAck(GAME_SYNC)
      if (response.ok) setState(response.state)
    }
    function onDisconnect() {
      setConnected(false)
    }
    function onConnectError(err) {
      // err.data komt van de sessionMiddleware op de server, bijv. { error: 'NO_SESSION' }
      setError(err.data ?? { error: 'CONNECT_ERROR', message: err.message })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    connectToGame(code, role)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      disconnectFromGame()
    }
  }, [code, role, enabled])

  return { connected, state, error }
}
