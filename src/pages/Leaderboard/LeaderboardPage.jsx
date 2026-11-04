import { useEffect, useMemo, useState } from "react";
import PageRings from "../../components/PageRings.jsx";
import Podium from "../../components/Podium.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import { useAuth } from '../../auth/AuthContext.jsx'
import { api } from "../../api/http.js";
import { getRanking } from "../../utils/ranking.js";
import { SKILLS } from '../../utils/skills.js'
import "./LeaderboardPage.css";

// Waarop je kunt sorteren. id = het veld uit /api/leaderboard, label = de tekst op de knop (Nederlands).
const METRICS = [
  { id: 'totalScore', label: 'Totale score' },
  { id: 'totalWins', label: 'Gewonnen' },
  { id: 'gamesPlayed', label: 'Gespeeld' },
  { id: 'averageScore', label: 'Gemiddelde score' },
  { id: 'totalCorrect', label: 'Goede antwoorden' },
]

/**
 * @param {{ ranking: Array<{ id: number, name: string, skills: Record<string, number>, totalScore: number, totalWins: number, gamesPlayed: number, averageScore: number, totalCorrect: number }> }} props
 */
export function Leaderboard({ ranking }) {
  const { user } = useAuth()
  const [activeMetric, setActiveMetric] = useState('totalScore')
  const [activeRole, setActiveRole] = useState(null)

  // Een sorteerknop zet het filter op beroepsrol uit; een rol-knop houdt de gekozen sortering.
  const handleMetricClick = (metric) => {
    setActiveMetric(metric)
    setActiveRole(null)
  }

  const rows = useMemo(() => rankBy(ranking, activeMetric, activeRole), [ranking, activeMetric, activeRole])
  const me = user ? rows.find((row) => row.id === user.id) : null

  return (
    <div className="page end-screen">
      <PageRings />
      <QuizHeader large />

      <main className="page__main end-screen__main">
        <h1 className="end-screen__title">LEADERBOARD</h1>

        <div className="leaderboard-options">
            {METRICS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`leaderboard-options-btn ${!activeRole && activeMetric === id ? 'leaderboard-options-btn-active' : ''}`}
                onClick={() => handleMetricClick(id)}
              >
                {label}
              </button>
            ))}
        </div>

        <div className="leaderboard-roles" aria-label="Kies een beroepsrol">
            {SKILLS.map(({ code }) => (
              <button
                key={code}
                type="button"
                className={`leaderboard-options-btn leaderboard-role-btn ${activeRole === code ? 'leaderboard-options-btn-active' : ''}`}
                onClick={() => setActiveRole(code)}
              >
                {code}
              </button>
            ))}
        </div>

        <Podium ranking={me ? [me] : []} />
        <Scoreboard rows={rows} myPlayerId={user?.id} columns={1} />
      </main>
    </div>
  );
}

/**
 * Rijen voor podium en scoreboard, met de plaats uit getRanking (src/utils/ranking.js).
 * Zo werkt een gedeelde plaats hier precies zoals op het eindscherm: gelijke score = zelfde plaats (1, 2, 2, 4),
 * en binnen een gelijke stand op naam.
 * Met een beroepsrol gekozen: alleen spelers die die vaardigheid hebben ingevuld (hoger dan 0).
 */
function rankBy(users, metric, role) {
  const visible = role ? users.filter((entry) => getSkillValue(entry, role) > 0) : users
  return getRanking(
    visible.map((entry) => ({
      id: entry.id,
      nickname: entry.name,
      skillCode: role,
      skillValue: getSkillValue(entry, role),
      score: entry[metric] ?? 0,
    })),
  )
}

function getSkillValue(user, role) {
  return role ? user.skills?.[role] ?? 0 : null
}

export default function LeaderboardPage() {
    const [ranking, setRanking] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api('/leaderboard')
        .then(setRanking)
        .catch((apiError) => setError(apiError.message));
    }, []);

    if (error) return <p role="alert">{error}</p>;
    if (!ranking) return <p role="status">Leaderboard wordt geladen...</p>;

    return <Leaderboard ranking={ranking} />;
}
