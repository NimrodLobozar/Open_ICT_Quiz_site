import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { socket } from '../../socket.js'
import './Lobbypage.css'

const skillDefinitions = [
  { label: 'SD', color: '#f59e0b' },
  { label: 'AI', color: '#14b8a6' },
  { label: 'TI', color: '#facc15' },
  { label: 'CSC', color: '#6366f1' },
  { label: 'GD', color: '#22c55e' },
  { label: 'BI', color: '#3b82f6' },
]

export default function LobbyPlayerPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (!code) return undefined

    let session = null
    try {
      session = JSON.parse(localStorage.getItem('quizSession') || 'null')
    } catch {
      localStorage.removeItem('quizSession')
    }

    const handleLobbyUpdate = ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers)
    }

    const joinLobby = () => {
      socket.emit('lobby:join', {
        code,
        playerId: session?.playerId,
        role: 'player',
      }, (result) => {
        if (!result?.ok) {
          localStorage.removeItem('quizSession')
          navigate(`/join/${code}`, { replace: true })
        }
      })
    }

    socket.on('lobby:update', handleLobbyUpdate)
    socket.on('connect', joinLobby)

    if (socket.connected) {
      joinLobby()
    } else {
      socket.connect()
    }

    return () => {
      socket.off('lobby:update', handleLobbyUpdate)
      socket.off('connect', joinLobby)
      socket.disconnect()
    }
  }, [code, navigate])

  if (!code) {
    return <div>Geen code opgegeven. Ga terug naar de startpagina.</div>
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header-box">
        <div className="lobby-instruction">
          Je wacht tot de host de quiz start
        </div>
        <div className="lobby-pin-section">
          <span className="lobby-pin-label">Spel-PIN:</span>
          <span className="lobby-pin-code">{code}</span>
        </div>
      </div>

      <div className="lobby-participants" aria-live="polite">
        {players.length === 0 ? (
          <div className="lobby-status-box">Wachten op deelnemers</div>
        ) : (
          players.map((player) => (
            <div className="lobby-player-card" key={player.id}>
              <span className="lobby-player-name">{player.nickname}</span>
              <div className="lobby-player-tooltip" role="tooltip">
                {Object.entries(player.skills || {}).map(([skill, score]) => {
                  const definition = skillDefinitions.find((item) => item.label === skill)

                  return (
                    <div className="lobby-skill-row" key={skill}>
                      <span className="skill-label">
                        {definition && (
                          <span
                            className="skill-dot"
                            style={{ backgroundColor: definition.color }}
                            aria-hidden="true"
                          />
                        )}
                        {skill}
                      </span>
                      <strong>{score}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
