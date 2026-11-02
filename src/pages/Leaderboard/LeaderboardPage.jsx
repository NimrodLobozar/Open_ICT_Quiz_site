import { useEffect, useState } from "react";
import PageRings from "../../components/PageRings.jsx";
import Podium from "../../components/Podium.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import { api } from "../../api/http.js";
import "./LeaderboardPage.css";

/**
 * @param {{ ranking: Array<{ id: number, name: string, totalScore: number, totalWins: number, gamesPlayed: number, averageScore: number, totalCorrect: number }> }} props
 */
export function Leaderboard({ ranking }) {

    const [leaderboard, setLeaderboard] = useState(ranking);
    const [activeOption, setActiveOption] = useState('Total Score');

    const handleOptionClick = (option) => {

        setActiveOption(option);

        let sortedUsers;
        switch (option) {
            case 'Total Score':
                sortedUsers = [...leaderboard].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
                break;
            case 'Total Wins':
                sortedUsers = [...leaderboard].sort((a, b) => b.totalWins - a.totalWins || a.name.localeCompare(b.name));
                break;
            case 'Games Played':
                sortedUsers = [...leaderboard].sort((a, b) => b.gamesPlayed - a.gamesPlayed || a.name.localeCompare(b.name));
                break;
            case 'Average Score':
                sortedUsers = [...leaderboard].sort((a, b) => b.averageScore - a.averageScore || a.name.localeCompare(b.name));
                break;
            case 'Total Correct':
                sortedUsers = [...leaderboard].sort((a, b) => b.totalCorrect - a.totalCorrect || a.name.localeCompare(b.name));
                break;
            default:
                sortedUsers = [...leaderboard].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
        }
              setLeaderboard(sortedUsers);
    };
  return (
    <div className="page end-screen">
      <PageRings />
      <QuizHeader large />

      <main className="page__main end-screen__main">
        <h1 className="end-screen__title">LEADERBOARD</h1>

        <div className="leaderboard-options">
            <button className={`leaderboard-options-btn ${activeOption === 'Total Score' ? 'leaderboard-options-btn-active' : ''}`} onClick={() => handleOptionClick('Total Score')}>Total Score</button>
            <button className={`leaderboard-options-btn ${activeOption === 'Total Wins' ? 'leaderboard-options-btn-active' : ''}`} onClick={() => handleOptionClick('Total Wins')}>Total Wins</button>
            <button className={`leaderboard-options-btn ${activeOption === 'Games Played' ? 'leaderboard-options-btn-active' : ''}`} onClick={() => handleOptionClick('Games Played')}>Games Played</button>
            <button className={`leaderboard-options-btn ${activeOption === 'Average Score' ? 'leaderboard-options-btn-active' : ''}`} onClick={() => handleOptionClick('Average Score')}>Average Score</button>
            <button className={`leaderboard-options-btn ${activeOption === 'Total Correct' ? 'leaderboard-options-btn-active' : ''}`} onClick={() => handleOptionClick('Total Correct')}>Total Correct</button>
        </div>
        <Scoreboard
          rows={leaderboard.map((user, index) => ({
            id: user.id,
            nickname: user.name,
            score: activeOption === 'Total Score' ? user.totalScore :
                   activeOption === 'Total Wins' ? user.totalWins :
                   activeOption === 'Games Played' ? user.gamesPlayed :
                   activeOption === 'Average Score' ? user.averageScore :
                   activeOption === 'Total Correct' ? user.totalCorrect : 0,
            rank: index + 1,
          }))}
          columns={1}
        />
      </main>
    </div>
  );
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
