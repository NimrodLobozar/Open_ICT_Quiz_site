// De fases van één game (projectplan 8.3).
// Als constanten, zodat een typfout ('PODUIM') meteen een fout geeft in plaats van stil niets te doen.
// Nu gebouwd: LOBBY en PODIUM. De vraag-fases komen met de game loop (fase 4).
export const PHASES = {
  LOBBY: 'LOBBY',
  QUESTION_PREVIEW: 'QUESTION_PREVIEW',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  QUESTION_RESULT: 'QUESTION_RESULT',
  LEADERBOARD: 'LEADERBOARD',
  PODIUM: 'PODIUM',
}
