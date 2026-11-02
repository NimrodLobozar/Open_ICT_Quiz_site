import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
// index.css vóór App: dan komt de CSS van de pagina's erna en wint die bij gelijke selectors.
// Zo kan een pagina bijv. de padding van .page__main aanpassen in haar eigen CSS.
import './index.css'
import { App as AntApp } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* AuthProvider: wie is er ingelogd (useAuth). AntApp: meldingen zoals message.success() op elke pagina.
          component={false}: AntApp zet geen extra <div> om de pagina, dus de opmaak van .page blijft hetzelfde. */}
      <AuthProvider>
        <AntApp component={false}>
          <App />
        </AntApp>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
