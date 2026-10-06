import { DesktopOutlined, MobileOutlined } from '@ant-design/icons'
import { Card, Col, Row, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

// Startpagina: kies "Quiz hosten" of "Meedoen" (zie projectplan 3.1 en 3.2).
export default function HomePage() {
  const navigate = useNavigate()

  return (
    <>
      <Typography.Title style={{ textAlign: 'center' }}>
        Welkom bij de Open ICT Quiz
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
        Speel samen een quiz en ontdek wie waar goed in is.
      </Typography.Paragraph>

      <Row gutter={[16, 16]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <Card hoverable onClick={() => navigate('/join')} style={{ textAlign: 'center' }}>
            <MobileOutlined style={{ fontSize: 48 }} />
            <Typography.Title level={3}>Meedoen</Typography.Title>
            <Typography.Text type="secondary">Vul de code van 6 cijfers in</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable onClick={() => navigate('/quizzes')} style={{ textAlign: 'center' }}>
            <DesktopOutlined style={{ fontSize: 48 }} />
            <Typography.Title level={3}>Quiz hosten</Typography.Title>
            <Typography.Text type="secondary">Kies een quiz en open een lobby</Typography.Text>
          </Card>
        </Col>
      </Row>
      {/* TODO(team, L1): inloggen/registreren-knop zodra er accounts zijn. */}
    </>
  )
}
