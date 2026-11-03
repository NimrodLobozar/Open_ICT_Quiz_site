import "dotenv/config";
import express from "express";
import { jsonBodyOnly, loadUser } from "./auth/middleware.js";
import { GameError } from "./game/GameError.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import gamesRouter from "./routes/games.js";
import healthRouter from "./routes/health.js";
import leaderboardRouter from "./routes/leaderboard.js";
import meRouter from "./routes/me.js";
import quizzesRouter from "./routes/quizzes.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// Vertel niet aan iedereen welke server we draaien ("X-Powered-By: Express").
app.disable("x-powered-by");
// limit: een quiz met 50 vragen past ruim in 100 kB; grotere bodies zijn misbruik.
app.use(express.json({ limit: "100kb" }));
app.use("/api", jsonBodyOnly);
// Voor elke API-request: wie is er ingelogd? (request.user, of null)
app.use("/api", loadUser);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/admin", adminRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/games", gamesRouter);
app.use("/api/leaderboard", leaderboardRouter);

// Onbekende API-route: een JSON-fout in plaats van Express' HTML-pagina.
app.use("/api", (_request, response) => {
  response
    .status(404)
    .json({ error: "NOT_FOUND", message: "Deze API-route bestaat niet." });
});

// Alle fouten komen hier terecht (Express 5 vangt ook fouten uit async routes op).
// ApiError en GameError zijn bedoeld voor de gebruiker; al het andere is een bug en krijgt een algemene melding,
// zodat er nooit interne details (SQL, stacktraces, bestandsnamen) naar de browser lekken.
app.use((error, _request, response, _next) => {
  // Kapotte JSON in de body (express.json) of een te grote body.
  if (error?.type === "entity.parse.failed") {
    return response
      .status(400)
      .json({
        error: "BAD_JSON",
        message: "De gegevens konden niet gelezen worden.",
      });
  }
  if (error?.type === "entity.too.large") {
    return response
      .status(413)
      .json({ error: "TOO_LARGE", message: "Te veel gegevens in één keer." });
  }
  if (error instanceof ApiError || error instanceof GameError) {
    return response
      .status(error.status)
      .json({ error: error.code, message: error.message });
  }
  console.error(error);
  response
    .status(500)
    .json({ error: "SERVER_ERROR", message: "Er ging iets mis op de server." });
});

export default app;
