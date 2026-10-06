import { Layout, Typography } from 'antd'
import { Link, Outlet } from 'react-router-dom'

const { Header, Content } = Layout

// Basis-layout voor alle pagina's: header met titel + de pagina zelf (Outlet).
// Mobiel eerst: de inhoud is smal op telefoons en gecentreerd op grote schermen.
export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', paddingInline: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/favicon.svg" alt="" width={32} height={32} />
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            Open ICT Quiz
          </Typography.Title>
        </Link>
      </Header>
      <Content style={{ padding: 16 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
