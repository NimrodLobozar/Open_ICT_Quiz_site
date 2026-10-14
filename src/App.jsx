import { Link, Navigate, Route, Routes } from "react-router-dom";
import QuizHeader from "./components/QuizHeader.jsx";
import EndScreenPageHost from "./pages/EndScreenPage_Host/EndScreenPage.jsx";
import EndScreenPagePlayer from "./pages/EndScreenPage_Player/EndScreenPage.jsx";
import HostGamePage, {
  HostCreatePage,
} from "./pages/HostGamePage/HostGamePage.jsx";
import JoinPage from "./pages/JoinPage/JoinPage.jsx";
import LobbyPage from "./pages/Lobby/LobbyPage.jsx";
import LobbyPlayer from "./pages/Lobby/LobbyPlayer.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import PlayerGamePage from "./pages/PlayerGamePage/PlayerGamePage.jsx";
import PlayerQuestionPage from "./pages/QuestionPage_Player/PlayerQuestionPage.jsx";
import PlayerResultPage from "./pages/QuestionPage_Player/PlayerResultPage.jsx";
import LeaderboardPage from "./pages/QuestionPage_Host/LeaderboardPage.jsx";
import QuestionAnswersPage from "./pages/QuestionPage_Host/QuestionAnswersPage.jsx";
import QuestionPreviewPage from "./pages/QuestionPage_Host/QuestionPreviewPage.jsx";
import TemplatePage from "./pages/_Template/TemplatePage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* TODO(team, volgende sprint): echte startpagina met keuze tussen hosten en meedoen.
            Tot die er is, sturen we iedereen op de voorpagina door naar het joinformulier.
            Werkt voor elk adres (localhost, IP of domein), want het kijkt alleen naar het pad. */}
        <Route path="/" element={<Navigate to="/join" replace />} />
        {/* Linkjes naar alle pagina's, voor het team. Niet gelinkt: je moet de URL kennen. */}
        <Route
          path="/dev"
          element={
            <div className="page">
              <QuizHeader />
              <main className="page__main">
                <h1>Welcome to the Quiz</h1>
                <Link to="/host/new">Quiz hosten (test)</Link>
                <br />
                <Link to="/join">Meedoen</Link>
                <br />
                <Link to="/end">Naar het eindscherm - Host</Link>
                <br />
                <Link to="/end-player">Naar het Eindscherm - Player</Link>
                <br />
                <Link to="/lobby">Kom hierheen</Link>
                <br />
                <Link to="/question">Naar het vraagscherm - Host</Link>
                <br />
                <Link to="/question-answers">
                  Naar vraag + antwoorden - Host
                </Link>
                <br />
                <Link to="/leaderboard">Naar de tussenstand - Host</Link>
                <br />
                <Link to="/player-question">Naar het vraagscherm - Player</Link>
                <br />
                <Link to="/player-result">Naar de uitslag per vraag - Player</Link>
                <br />
                <Link to="/template">Sjabloon voor een nieuwe pagina</Link>
              </main>
            </div>
          }
        />
        <Route path="/lobbyplayer" element={<LobbyPlayer />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/play/:code" element={<PlayerGamePage />} />
        <Route path="/host/new" element={<HostCreatePage />} />
        <Route path="/host/:code" element={<HostGamePage />} />
        {/* Demo's met nepdata, om de designs te bekijken. */}
        <Route path="/end" element={<EndScreenPageHost />} />
        <Route path="/end-player" element={<EndScreenPagePlayer />} />
        <Route path="/question" element={<QuestionPreviewPage />} />
        <Route path="/question-answers" element={<QuestionAnswersPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/player-question" element={<PlayerQuestionPage />} />
        <Route path="/player-result" element={<PlayerResultPage />} />
        {/* Sjabloon om te kopiëren voor een nieuwe pagina. */}
        <Route path="/template" element={<TemplatePage />} />
        {/* TODO(team, L1): echte pagina's zodra er accounts zijn. */}
        <Route path="/login" element={<PlaceholderPage title="Inloggen" />} />
        <Route
          path="/account/nieuw"
          element={<PlaceholderPage title="Account maken" />}
        />
        {/* Onbekende URL: ook naar het joinformulier, in plaats van een lege pagina. */}
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </>
  );
}
