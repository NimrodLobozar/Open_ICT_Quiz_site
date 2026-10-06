import { Card } from 'antd'

/**
 * TODO(team, Fase 5): tussenstand na elke vraag (host-scherm).
 * - Data uit `leaderboard:show`: { top: [{ nickname, score, rankChange }] }.
 * - Toon top 5–10 met punten en een pijltje omhoog/omlaag voor rankChange.
 * @param {{ top: { nickname: string, score: number, rankChange: number }[] }} props
 */
export default function Leaderboard({ top = [] }) {
  return <Card title="Tussenstand">TODO(team): {top.length} spelers tonen</Card>
}
