import { Link, Route, Routes } from "react-router-dom";
import EndScreenPageHost from "./pages/EndScreenPage_Host/EndScreenPage.jsx";
import EndScreenPagePlayer from "./pages/EndScreenPage_Player/EndScreenPage.jsx";
import HostGamePage, {
  HostCreatePage,
} from "./pages/HostGamePage/HostGamePage.jsx";
import JoinPage from "./pages/JoinPage/JoinPage.jsx";
import LobbyHost from "./pages/LobbyHost.jsx";
import LobbyPage from "./pages/Lobby/LobbyPage.jsx";
import LobbyPlayer from "./pages/Lobby/LobbyPlayer.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import PlayerGamePage from "./pages/PlayerGamePage/PlayerGamePage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1>Welcome to the Quiz</h1>
              <Link to="/host/new">Quiz hosten (test)</Link>
              <br />
              <Link to="/join">Meedoen</Link>
              <br />
              <Link to="/end">Naar het eindscherm - Host</Link>
              <br />
              <Link to="/end-player">Naar het Eindscherm - Player</Link>
              <br />
              <a href="/lobbyhost">
                <button>Kom maar hier heen</button>
              </a>
            </>
          }
        />
        <Route path="/lobbyplayer" element={<LobbyPlayer />} />
        <Route path="/lobbyhost" element={<LobbyHost />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/play/:code" element={<PlayerGamePage />} />
        <Route path="/host/new" element={<HostCreatePage />} />
        <Route path="/host/:code" element={<HostGamePage />} />
        {/* Demo's met nepdata, om de designs te bekijken. */}
        <Route path="/end" element={<EndScreenPageHost />} />
        <Route path="/end-player" element={<EndScreenPagePlayer />} />
        {/* TODO(team, L1): echte pagina's zodra er accounts zijn. */}
        <Route path="/login" element={<PlaceholderPage title="Inloggen" />} />
        <Route
          path="/account/nieuw"
          element={<PlaceholderPage title="Account maken" />}
        />
      </Routes>
    </>
  );
}
