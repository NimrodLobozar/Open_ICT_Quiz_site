import Podium from '../components/Podium.jsx'
import { gameResults } from '../data/dummyDatabase.js'
import { getRanking } from '../utils/ranking.js'
import './EndScreenPage.css'

// TODO(team): dummy data vervangen door de echte uitslag (socket-event game:podium) zodra de server er is.
const SESSION_ID = 1

export default function EndScreenPage() {
  const ranking = getRanking(gameResults.filter((result) => result.sessionId === SESSION_ID))

  return (
    <main className="end-screen">
      <Podium ranking={ranking} />
      {/* TODO(team): hieronder komt het scrollbare scoreboard, met dezelfde `ranking`. */}
    </main>
  )
}
