import { useNavigate, Link } from 'react-router-dom';
import './LobbyPage.css';

export default function LobbyPage() {
  const navigate = useNavigate();

  return (
    <div className="lobby-container">
      {/* Terug naar home knop linksboven */}
     <div style={{ width: "100%", display: "flex", justifyContent: "flex-start", paddingBottom: "10px" }}>
  <Link 
    to="/" 
    className="lobby-start-btn" 
    style={{ textDecoration: "none", display: "inline-block" }}
  >
          Terug naar Home
        </Link>
      </div>

      {/* Bovenste balk met instructie en de PIN */}
      <div className="lobby-header-box">
        <div className="lobby-instruction">
          Neem deel op&nbsp;<strong>je telefoon of laptop</strong>
        </div>
        <div className="lobby-pin-section">
          <span className="lobby-pin-label">Spel-PIN:</span>
          <span className="lobby-pin-code">464816</span>
        </div>
      </div>

      {/* Midden: Wachten op deelnemers */}
      <div className="lobby-status-box">
        Wachten op deelnemers
      </div>

      {/* Rechtsonder knop */}
      <div className="lobby-footer">
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