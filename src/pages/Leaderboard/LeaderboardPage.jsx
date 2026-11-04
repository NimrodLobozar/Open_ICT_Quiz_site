import { useEffect, useState } from "react";
import PageRings from "../../components/PageRings.jsx";
import Podium from "../../components/Podium.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import { useAuth } from '../../auth/AuthContext.jsx'
import { api } from "../../api/http.js";
import { SKILLS } from '../../utils/skills.js'
import "./LeaderboardPage.css";

/**
 * @param {{ ranking: Array<{ id: number, name: string, skills: Record<string, number>, totalScore: number, totalWins: number, gamesPlayed: number, averageScore: number, totalCorrect: number }> }} props
 */
export function Leaderboard({ ranking }) {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState(ranking)
  const [activeOption, setActiveOption] = useState('Total Score')
  const [activeRole, setActiveRole] = useState(null)

  const handleOptionClick = (option) => {
    setActiveOption(option)
    setActiveRole(null)
    setLeaderboard(sortUsers(ranking, option))
  }

  const handleRoleClick = (role) => {
    setActiveRole(role)
    setLeaderboard(sortUsers(ranking.filter((entry) => getSkillValue(entry, role) > 0), activeOption))
  }

  const me = user ? leaderboard.find((entry) => entry.id === user.id) : null
  const podium = me ? [{
    id: me.id,
    nickname: me.name,
    skillCode: activeRole,
    skillValue: getSkillValue(me, activeRole),
    score: getMetricValue(me, activeOption),
    rank: getRank(leaderboard, me.id, activeOption),
  }] : []

  return (
    <div className="page end-screen">
      <PageRings />
      <QuizHeader large />

      <main className="page__main end-screen__main">
        <h1 className="end-screen__title">LEADERBOARD</h1>

        <div className="leaderboard-options">
            {['Total Score', 'Total Wins', 'Games Played', 'Average Score', 'Total Correct'].map((option) => (
              <button
                key={option}
                type="button"
                className={`leaderboard-options-btn ${!activeRole && activeOption === option ? 'leaderboard-options-btn-active' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
        </div>

        <div className="leaderboard-roles" aria-label="Kies een beroepsrol">
            {SKILLS.map(({ code }) => (
              <button
                key={code}
                type="button"
                className={`leaderboard-options-btn leaderboard-role-btn ${activeRole === code ? 'leaderboard-options-btn-active' : ''}`}
                onClick={() => handleRoleClick(code)}
              >
                {code}
              </button>
            ))}
        </div>

        <Podium ranking={podium} />
        <Scoreboard
          rows={leaderboard.map((user) => ({
            id: user.id,
            nickname: user.name,
            skillCode: activeRole,
            skillValue: getSkillValue(user, activeRole),
            score: getMetricValue(user, activeOption),
            rank: getRank(leaderboard, user.id, activeOption),
          }))}
          myPlayerId={user?.id}
          columns={1}
        />
      </main>
    </div>
  );
}

function getMetricValue(user, option) {
  const values = {
    'Total Score': user.totalScore,
    'Total Wins': user.totalWins,
    'Games Played': user.gamesPlayed,
    'Average Score': user.averageScore,
    'Total Correct': user.totalCorrect,
  }
  return values[option] ?? user.totalScore
}

function getSkillValue(user, role) {
  return role ? user.skills?.[role] ?? 0 : null
}

function sortUsers(users, option) {
  return [...users].sort((first, second) =>
        getMetricValue(second, option) - getMetricValue(first, option) || first.name.localeCompare(second.name),
  )
}

function getRank(users, userId, option) {
  const current = users.find((user) => user.id === userId)
  if (!current) return 0
  return users.filter((user) => getMetricValue(user, option) > getMetricValue(current, option)).length + 1
}

export default function LeaderboardPage() {
    const [ranking, setRanking] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api('/leaderboard')
        .then((users) => {
            const sortedUsers = [...users].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
            setRanking(sortedUsers);
        })
        .catch((apiError) => setError(apiError.message));
    }, []);

    if (error) return <p role="alert">{error}</p>;
    if (!ranking) return <p role="status">Leaderboard wordt geladen...</p>;

    return <Leaderboard ranking={ranking} />;
}
