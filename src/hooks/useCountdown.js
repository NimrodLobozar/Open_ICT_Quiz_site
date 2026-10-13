import { useEffect, useState } from 'react'

/**
 * Aftellen tot een tijdstip (in ms sinds 1970, zoals Date.now()).
 * De server stuurt een tijdstip (startsAt) en geen "nog 20 seconden": zo telt elk scherm
 * naar hetzelfde moment af, ook als een bericht iets later binnenkomt of je de pagina ververst.
 * @param {number | null} endsAt  null = niet aftellen
 * @returns {number} milliseconden die nog over zijn (nooit onder 0)
 */
export function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt == null) return
    setNow(Date.now())
    // Vaker dan 1× per seconde, zodat de balk en de ring soepel bewegen.
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= endsAt) clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [endsAt])

  return endsAt == null ? 0 : Math.max(0, endsAt - now)
}
