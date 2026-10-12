import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Lobbypage.css'; // Importeer je stijlen hier
import { socket } from '../../socket.js';

const skillDefinitions = [
  { label: 'SD', color: '#f59e0b' },
  { label: 'AI', color: '#14b8a6' },
  { label: 'TI', color: '#facc15' },
  { label: 'CSC', color: '#6366f1' },
  { label: 'GD', color: '#22c55e' },
  { label: 'BI', color: '#3b82f6' },
]

const dummyLobby = {
  userlist: [
    { id: 1, username: 'Alex', skills: {
      'SD': 3,
      'TI': 2,
      'CSC': 1,
      'GD': 4,
      'AI': 5,
      'BI': 2,
    } },
    { id: 2, username: 'Samira', skills: {
      'SD': 4,
      'TI': 1,
      'CSC': 3,
      'GD': 2,
      'AI': 5,
      'BI': 3,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
    { id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },{ id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },{ id: 3, username: 'Milan', skills: {
      'SD': 2,
      'TI': 3,
      'CSC': 4,
      'GD': 1,
      'AI': 5,
      'BI': 2,
    } },
  ],
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const [lobby, setLobby] = useState({ userlist: [] });
  const [isLocked, setIsLocked] = useState(false);
  const { code } = useParams();

  useEffect(() => {
    if (!code) return undefined;

    const handleLobbyUpdate = ({ players }) => {
      setLobby({
        userlist: players.map((player) => ({
          id: player.id,
          username: player.nickname,
          skills: player.skills || {},
        })),
      });
    };

    const handleLobbyLocked = ({ locked }) => {
      setIsLocked(locked);
    };

    const joinLobby = () => {
      socket.emit('lobby:join', {
        code,
        role: 'host',
      }, (result) => {
        if (!result?.ok) {
          navigate('/', { replace: true });
        }
      });
    };

    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('lobby:locked', handleLobbyLocked);
    socket.on('connect', joinLobby);

    if (socket.connected) {
      joinLobby();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('lobby:locked', handleLobbyLocked);
      socket.off('connect', joinLobby);
      socket.disconnect();
    };
  }, [code, navigate]);

  const toggleLock = () => {
    socket.emit('lobby:lock', { locked: !isLocked }, (result) => {
      if (result?.ok) setIsLocked(result.locked);
    });
  };

  if (!code) {
    return <div>Geen code opgegeven. Ga terug naar de startpagina.</div>;
  }

  return (
    <div className="lobby-container">
      {/* Bovenste balk met instructie en de PIN */}
      <div className="lobby-header-box">
        <div className="lobby-instruction">
          Neem deel op&nbsp;<strong>je telefoon of laptop</strong>
        </div>
        <div className="lobby-pin-section">
          <span className="lobby-pin-label">Spel-PIN:</span>
          <span className="lobby-pin-code">{code}</span>
        </div>
      </div>

      {/* Midden: deelnemers of een wachtmelding */}
      <div className="lobby-participants" aria-live="polite">
        {lobby.userlist.length === 0? (
          <div className="lobby-status-box">Wachten op deelnemers</div>
        ) : (
          lobby.userlist.map((user) => (
            <div
              className="lobby-player-card"
              key={user.id}
            >
              <span className="lobby-player-name">{user.username}</span>
              <div className="lobby-player-tooltip" role="tooltip">
                {Object.entries(user.skills).map(([skill, score]) => (
                  <div className="lobby-skill-row" key={skill}>
                    <span className="skill-label">
                      {skillDefinitions.find((s) => s.label === skill)?.color && (
                        <span className="skill-dot" style={{ backgroundColor: skillDefinitions.find((s) => s.label === skill)?.color }} aria-hidden="true" />
                      )}
                      {skillDefinitions.find((s) => s.label === skill)?.label}
                    </span>
                    <strong>{score}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rechtsonder knop */}
      <div className="lobby-footer">
        <button
          onClick={toggleLock}
          className="lobby-lock-btn"
          type="button"
        >
          {isLocked ? 'Ontgrendel lobby' : 'Lobby vergrendelen'}
        </button>
        <button 
          onClick={() => navigate('/end')}
          className="lobby-start-btn"
        >
          Start
        </button>
      </div>
    </div>
  );
}