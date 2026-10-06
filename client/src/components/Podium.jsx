import { Card } from 'antd'

/**
 * TODO(team, Fase 5): podium met plek 1, 2 en 3 groot in beeld (host-scherm).
 * - Data uit `game:podium`: { top3: [...], ranking: [...] }.
 * - Klassieke opstelling: 2 – 1 – 3, met de winnaar in het midden en het hoogst.
 * @param {{ top3: { rank: number, nickname: string, score: number }[] }} props
 */
export default function Podium({ top3 = [] }) {
  return <Card title="Podium">TODO(team): {top3.map((p) => p.nickname).join(', ')}</Card>
}
