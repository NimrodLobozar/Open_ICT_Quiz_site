import { Link, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import QuizHeader from "./components/QuizHeader.jsx";
import AccountPage from "./pages/Account/AccountPage.jsx";
import SettingsPage from "./pages/Account/SettingsPage.jsx";
import AdminAccountPage from "./pages/Admin/AdminAccountPage.jsx";
import OverviewPage from "./pages/Admin/OverviewPage.jsx";
import QuizEditorPage from "./pages/Admin/QuizEditorPage.jsx";
import QuizzesPage from "./pages/Admin/QuizzesPage.jsx";
import ResultsPage from "./pages/Admin/ResultsPage.jsx";
import UsersPage from "./pages/Admin/UsersPage.jsx";
import AuthPage from "./pages/Auth/AuthPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage.jsx";
import PrivacyPage from "./pages/Auth/PrivacyPage.jsx";
import SetPasswordPage from "./pages/Auth/SetPasswordPage.jsx";
import VerifyEmailPage from "./pages/Auth/VerifyEmailPage.jsx";
import EndScreenPageHost from "./pages/EndScreenPage_Host/EndScreenPage.jsx";
import EndScreenPagePlayer from "./pages/EndScreenPage_Player/EndScreenPage.jsx";
import HostGamePage, {
  HostCreatePage,
} from "./pages/HostGamePage/HostGamePage.jsx";
import JoinPage from "./pages/JoinPage/JoinPage.jsx";
import LobbyPage from "./pages/Lobby/LobbyPage.jsx";
import LobbyPlayer from "./pages/Lobby/LobbyPlayer.jsx";
import PlayerGamePage from "./pages/PlayerGamePage/PlayerGamePage.jsx";
import PlayerQuestionPage from "./pages/QuestionPage_Player/PlayerQuestionPage.jsx";
import PlayerResultPage from "./pages/QuestionPage_Player/PlayerResultPage.jsx";
import LeaderboardPage from "./pages/QuestionPage_Host/LeaderboardPage.jsx";
import QuestionAnswersPage from "./pages/QuestionPage_Host/QuestionAnswersPage.jsx";
import QuestionPreviewPage from "./pages/QuestionPage_Host/QuestionPreviewPage.jsx";
import TemplatePage from "./pages/_Template/TemplatePage.jsx";

// Rollen die quizzen mogen maken en hosten.
const STAFF = ["TEACHER", "ADMIN"];

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
                <Link to="/admin">Quiz hosten (log in als docent)</Link>
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
        {/* Hosten mag alleen een docent of beheerder (story 7); de server controleert het ook. */}
        <Route
          path="/host/new"
          element={
            <RequireAuth roles={STAFF}>
              <HostCreatePage />
            </RequireAuth>
          }
        />
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
        {/* Accounts (sprint 2): inloggen, registreren, wachtwoord vergeten. */}
        <Route path="/inloggen" element={<AuthPage mode="login" />} />
        <Route path="/registreren" element={<AuthPage mode="register" />} />
        <Route path="/wachtwoord-vergeten" element={<ForgotPasswordPage />} />
        <Route path="/wachtwoord-instellen" element={<SetPasswordPage />} />
        <Route path="/email-bevestigen" element={<VerifyEmailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        {/* Oude adressen uit sprint 1. */}
        <Route path="/login" element={<Navigate to="/inloggen" replace />} />
        <Route path="/account/nieuw" element={<Navigate to="/registreren" replace />} />
        <Route path="/profiel" element={<Navigate to="/account" replace />} />
        {/* Mijn account: voor iedereen die is ingelogd. */}
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/account/instellingen" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        {/* Admin-portaal: docenten en beheerders; Gebruikers alleen beheerders. */}
        <Route path="/admin" element={<RequireAuth roles={STAFF}><OverviewPage /></RequireAuth>} />
        <Route path="/admin/quizzen" element={<RequireAuth roles={STAFF}><QuizzesPage /></RequireAuth>} />
        <Route path="/admin/quizzen/nieuw" element={<RequireAuth roles={STAFF}><QuizEditorPage key="nieuw" /></RequireAuth>} />
        <Route path="/admin/quizzen/:id" element={<RequireAuth roles={STAFF}><QuizEditorPage /></RequireAuth>} />
        <Route path="/admin/gebruikers" element={<RequireAuth roles={["ADMIN"]}><UsersPage /></RequireAuth>} />
        <Route path="/admin/uitslagen" element={<RequireAuth roles={STAFF}><ResultsPage /></RequireAuth>} />
        <Route path="/admin/account" element={<RequireAuth roles={STAFF}><AdminAccountPage /></RequireAuth>} />
        {/* Onbekende URL: ook naar het joinformulier, in plaats van een lege pagina. */}
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </>
  );
}
