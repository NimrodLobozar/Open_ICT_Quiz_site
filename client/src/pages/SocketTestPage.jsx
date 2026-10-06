import { Button, Card, List, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { DEV_PING } from '../socket/events.js'
import { emitWithAck, socket } from '../socket/socket.js'

// Alleen in development (/dev/socket): test of Socket.IO werkt. "Ping" → server antwoordt "pong".
export default function SocketTestPage() {
  const [connected, setConnected] = useState(socket.connected)
  const [log, setLog] = useState([])

  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.auth = {} // geen game: de server laat dit alleen in development toe
    socket.connect()
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
    }
  }, [])

  async function ping() {
    const sentAt = Date.now()
    const response = await emitWithAck(DEV_PING)
    const line = response.ok
      ? `${response.message} — servertijd ${response.serverTime} (${Date.now() - sentAt} ms)`
      : `Fout: ${response.message}`
    setLog((items) => [line, ...items].slice(0, 10))
  }

  return (
    <Card title="Socket-test" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Typography.Paragraph>
        Status:{' '}
        {connected ? <Tag color="green">verbonden</Tag> : <Tag color="red">niet verbonden</Tag>}
      </Typography.Paragraph>
      <Button type="primary" onClick={ping} disabled={!connected}>
        Ping
      </Button>
      <List
        style={{ marginTop: 16 }}
        dataSource={log}
        renderItem={(line) => <List.Item>{line}</List.Item>}
      />
    </Card>
  )
}
