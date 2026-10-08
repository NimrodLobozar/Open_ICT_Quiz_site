import { Link, Navigate, Route, Routes } from 'react-router-dom'
import EndScreenPage from './pages/EndScreenPage/EndScreenPage.jsx'
import JoinPage from './pages/JoinPage/JoinPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <h1>Welcome to the Quiz</h1>
            <Link to="/end">Naar het eindscherm (test)</Link>
          </>
        }
      />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/join/:code" element={<JoinPage />} />
      <Route path="/end" element={<EndScreenPage />} />
    </Routes>
  )
}