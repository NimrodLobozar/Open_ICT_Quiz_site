import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import HostGamePage from './pages/HostGamePage.jsx'
import HostSetupPage from './pages/HostSetupPage.jsx'
import JoinPage from './pages/JoinPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PlayerGamePage from './pages/PlayerGamePage.jsx'
import QuizBrowsePage from './pages/QuizBrowsePage.jsx'
import SocketTestPage from './pages/SocketTestPage.jsx'

// Alle routes van de app (zie docs/PROJECTPLAN.md hoofdstuk 7).
//
// De routes blijven staan, maar /quizzes, /host/new/:quizId, /host/:code, /join en /play/:code
// zijn leeggehaald: die bouwt het team zelf. Je werkt dus in het bijbehorende bestand in
// src/pages/ (elk met een TODO(team)-blok bovenaan). De oude skeleton-versies staan als voorbeeld
// in docs/reference/pages/ — uitleg in docs/reference/README.md.
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/quizzes" element={<QuizBrowsePage />} />
        <Route path="/host/new/:quizId" element={<HostSetupPage />} />
        <Route path="/host/:code" element={<HostGamePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/play/:code" element={<PlayerGamePage />} />
        {import.meta.env.DEV && <Route path="/dev/socket" element={<SocketTestPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
