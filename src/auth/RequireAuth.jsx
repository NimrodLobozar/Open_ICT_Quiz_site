import { Navigate, useLocation } from 'react-router-dom'
import QuizHeader from '../components/QuizHeader.jsx'
import { homeFor, useAuth } from './AuthContext.jsx'

/**
 * Om een route heen voor pagina's waarvoor je moet inloggen:
 *   <RequireAuth roles={['ADMIN']}><UsersPage /></RequireAuth>
 * Niet ingelogd → naar /inloggen (en daarna terug). Verkeerde rol → naar je eigen startpagina.
 * Let op: dit is alleen voor de gebruiker. De API controleert zelf ook, want dit kun je in de browser omzeilen.
 * @param {{ roles?: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>, children: React.ReactNode }} props
 */
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page">
        <QuizHeader />
        <main className="page__main">
          <p role="status">Laden…</p>
        </main>
      </div>
    )
  }
  if (!user) {
    const back = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/inloggen?terug=${back}`} replace />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}
