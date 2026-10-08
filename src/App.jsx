import { Navigate, Route, Routes } from 'react-router-dom'
import JoinPage from './pages/JoinPage/JoinPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<h1>Welcome to the Quiz</h1>} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/join/:code" element={<JoinPage />} />
    </Routes>
  )
}