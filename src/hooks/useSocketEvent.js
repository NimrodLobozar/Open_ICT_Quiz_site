import { useEffect, useRef } from 'react'
import { socket } from '../socket/socket.js'

/**
 * Luister naar een socket-event zolang het component op het scherm staat.
 * De handler mag elke render een nieuwe functie zijn: we bewaren de nieuwste in een ref,
 * zodat we niet bij elke render opnieuw hoeven te abonneren.
 */
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args)
    socket.on(event, listener)
    // Zonder off() stapelen de listeners op (bijv. na navigeren) en komt elk event dubbel binnen.
    return () => socket.off(event, listener)
  }, [event])
}
