import { CheckCircleFilled } from '@ant-design/icons'
import { Empty, Flex, Tag, Tooltip } from 'antd'

/**
 * Live lijst van spelers in de lobby (data komt uit het event `lobby:update`).
 * @param {{ players: { id: string, nickname: string, connected: boolean, isVerified: boolean, roles: string[] }[], highlightId?: string }} props
 */
export default function PlayerList({ players, highlightId }) {
  if (!players?.length) {
    return <Empty description="Nog geen spelers. Scan de QR-code of typ de code in!" />
  }

  return (
    <Flex wrap gap={8}>
      {players.map((player) => (
        <Tag
          key={player.id}
          color={player.id === highlightId ? 'purple' : undefined}
          style={{
            fontSize: 18,
            padding: '6px 12px',
            margin: 0,
            // Offline spelers grijs (ze kunnen altijd terugkomen via hun cookie).
            opacity: player.connected ? 1 : 0.45,
          }}
        >
          {player.nickname}
          {player.isVerified && (
            <Tooltip title="Account">
              <CheckCircleFilled style={{ marginLeft: 6, color: '#1677ff' }} />
            </Tooltip>
          )}
          {!player.connected && ' (offline)'}
        </Tag>
      ))}
      {/* TODO(team, L2): beroepsrollen als gekleurde badges achter de naam (player.roles). */}
    </Flex>
  )
}
