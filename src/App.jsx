import { Link, Navigate, Route, Routes } from "react-router-dom";
import EndScreenPage from "./pages/EndScreenPage/EndScreenPage.jsx";
import JoinPage from "./pages/JoinPage/JoinPage.jsx";
import LobbyHost from "./pages/LobbyHost.jsx";
import LobbyPage from "./pages/Lobby/LobbyPage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1>Welcome to the Quiz</h1>
              <Link to="/end">Naar het eindscherm (test)</Link>
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
        <Route path="/end" element={<EndScreenPage />} />
      </Routes>
    </>
  );
}
