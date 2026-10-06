import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import nlNL from 'antd/locale/nl_NL'
import App from './App.jsx'
import { theme } from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={theme} locale={nlNL}>
      {/* AntApp maakt message/notification/modal beschikbaar via App.useApp() */}
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
