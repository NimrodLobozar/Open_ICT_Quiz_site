// Zet scores om naar een ranglijst.
// Het podium en (later) het scoreboard gebruiken allebei deze functie,
// zodat de winnaars altijd overeenkomen met het scoreboard.
export function getRanking(results) {
  // Hoogste score eerst. Bij gelijke score op naam, zodat de volgorde altijd hetzelfde is.
  const sorted = [...results].sort(
    (a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname),
  )

  return sorted.map((result) => {
    // Gelijke score = zelfde plek (1, 1, 3…): je plek is de eerste plek met jouw score.
    const rank = sorted.findIndex((other) => other.score === result.score) + 1
    return { ...result, rank }
  })
}
