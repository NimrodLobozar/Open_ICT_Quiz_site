import { useEffect, useState } from 'react'

/**
 * Geeft `value` pas terug als hij `delay` ms niet meer veranderd is.
 * Voor zoekvelden: niet bij elke letter een request naar de server, maar pas als je even stopt met typen.
 */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
