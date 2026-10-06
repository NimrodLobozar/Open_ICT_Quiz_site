import { Flex, Typography } from 'antd'
import { QRCodeSVG } from 'qrcode.react'

/**
 * Join-URL voor een game. Op telefoons werkt "localhost" niet, daarom kun je in .env
 * PUBLIC_URL zetten (bijv. http://192.168.1.23:5173), of de host-pagina via je LAN-IP openen.
 */
function getJoinUrl(code) {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  return `${base.replace(/\/$/, '')}/join/${code}`
}

/** QR-code + de join-URL in tekst, voor op het digibord. */
export default function JoinQrCode({ code, size = 220 }) {
  const url = getJoinUrl(code)
  const isLocalhost = /\/\/(localhost|127\.0\.0\.1)/.test(url)

  return (
    <Flex vertical align="center" gap={8}>
      <div style={{ background: '#fff', padding: 12, borderRadius: 12 }}>
        <QRCodeSVG value={url} size={size} />
      </div>
      <Typography.Text copyable>{url}</Typography.Text>
      {isLocalhost && (
        <Typography.Text type="warning" style={{ fontSize: 13, textAlign: 'center' }}>
          Let op: telefoons kunnen &quot;localhost&quot; niet openen. Zet PUBLIC_URL in .env of open
          deze pagina via je LAN-IP.
        </Typography.Text>
      )}
    </Flex>
  )
}
