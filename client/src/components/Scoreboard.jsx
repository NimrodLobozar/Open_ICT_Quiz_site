import { Card } from 'antd'

/**
 * TODO(team, Fase 5): scrollbaar scorebord op het eindscherm van de speler.
 * - Data uit `game:podium`: ranking: [{ rank, nickname, score, isVerified }].
 * - Markeer de eigen rij (vergelijk met de eigen nickname/playerId).
 * - Scroll automatisch naar de eigen rij (ref + scrollIntoView({ block: 'center' })).
 * - Idee: op desktop meerdere kolommen naast elkaar (zie docs/IDEEEN.md).
 * @param {{ ranking: { rank: number, nickname: string, score: number }[], myNickname: string }} props
 */
export default function Scoreboard({ ranking = [] }) {
  return <Card title="Scorebord">TODO(team): {ranking.length} spelers tonen</Card>
}
