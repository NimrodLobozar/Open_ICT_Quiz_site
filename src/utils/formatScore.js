// Scores tonen met een punt als duizendtal-scheiding (7420 → "7.420"), zoals we in Nederland gewend zijn.
export function formatScore(score) {
  return score.toLocaleString('nl-NL')
}
