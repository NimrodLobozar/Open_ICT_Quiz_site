import { useEffect, useRef } from 'react'
import { socket } from '../socket/socket.js'

/**
 * Luistert naar een socket-event zolang het component bestaat.
 * Ruimt de listener automatisch op.
 *
 * Voorbeeld:
 *   useSocketEvent(LOBBY_UPDATE, (lobby) => setLobby(lobby))
 *
 * @param {string} event gebruik een constante uit socket/events.js
 * @param {(payload: any) => void} handler
 */
export function useSocketEvent(event, handler) {
  // We bewaren de nieuwste handler in een ref, zodat we niet bij elke render
  // opnieuw hoeven te (de)registreren.
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const listener = (payload) => handlerRef.current(payload)
    socket.on(event, listener)
    return () => socket.off(event, listener)
  }, [event])
}
