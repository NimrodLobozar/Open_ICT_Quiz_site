import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/http.js'

// Wie is er ingelogd? Eén plek voor de hele app (main.jsx zet <AuthProvider> om <App />).
// De echte controle zit altijd op de server; dit is alleen om de juiste knoppen en pagina's te tonen.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true tot we weten of er iemand is ingelogd, zodat een beveiligde pagina niet even "Log in" laat zien.
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Terugknop na uitloggen: sommige browsers tonen dan een bewaarde kopie van de pagina (bfcache).
    // Opnieuw vragen wie er is, dan stuurt RequireAuth je weg als je niet meer bent ingelogd.
    const onPageShow = (event) => {
      if (event.persisted) refresh()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [refresh])

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password, remember } })
    setUser(data.user)
    return data.user
  }, [])

  // Na registreren ben je nog níet ingelogd: eerst je e-mailadres bevestigen (story 14).
  const register = useCallback(async (fields) => {
    const data = await api('/auth/register', { method: 'POST', body: fields })
    return data.user
  }, [])

  const logout = useCallback(async () => {
    // Ook als de server niet antwoordt: hier in de browser ben je hoe dan ook uitgelogd.
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** @returns {{ user: null | { id: number, username: string, email: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN', skills: Record<string, number>, createdAt: string }, loading: boolean, login: Function, register: Function, logout: Function, refresh: Function, setUser: Function }} */
export function useAuth() {
  return useContext(AuthContext)
}

export const isStaff = (user) => user?.role === 'TEACHER' || user?.role === 'ADMIN'

/** Waar je na het inloggen heen gaat: studenten naar Mijn account, docenten en beheerders naar het beheerportaal. */
export function homeFor(user) {
  return isStaff(user) ? '/admin' : '/account'
}

/**
 * Het ?terug=-adres na het inloggen, maar alleen een pad binnen deze site.
 * "//evil.nl" of "https://evil.nl" zou je anders naar een nepsite kunnen sturen (open redirect).
 */
export function safeReturnPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : null
}

/** Twee letters voor het rondje met initialen: "Emma Jansen" → "EJ", "Emma" → "EM". */
export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.trim().slice(0, 2)
  return letters.toUpperCase()
}
